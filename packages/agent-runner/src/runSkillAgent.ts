import type { CanUseTool } from '@anthropic-ai/claude-agent-sdk';

import { query } from '@anthropic-ai/claude-agent-sdk';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import type {
  RunSkillAgentArgs,
  RunSkillAgentResult,
} from './runSkillAgent.types.ts';

import { assertSafeTargetPath } from './assertSafeTargetPath.util.ts';
import { cqmsRepoRoot } from './cqmsRepoRoot.util.ts';
import { deriveAllowedTools } from './deriveAllowedTools.util.ts';
import { loadSkillFrontmatter } from './skillFrontmatter.util.ts';

const MAX_TURNS = 40;

const describeMessage = (message: { type: string }): string =>
  'subtype' in message
    ? `${message.type}:${(message as { subtype: string }).subtype}`
    : message.type;

type ResultMessage = {
  readonly errors?: readonly string[];
  readonly num_turns: number;
  readonly permission_denials: readonly unknown[];
  readonly subtype: string;
  readonly total_cost_usd: number;
};

type ResultMessageSummary = {
  readonly errorMessage: string | undefined;
  readonly numTurns: number;
  readonly permissionDenials: readonly unknown[];
  readonly success: boolean;
  readonly totalCostUsd: number;
};

const resolveResultErrorMessage = (
  message: ResultMessage,
  success: boolean,
): string | undefined => {
  if (success) {
    return undefined;
  }

  if (message.errors !== undefined && message.errors.length > 0) {
    return message.errors.join('; ');
  }

  return message.subtype;
};

const summarizeResultMessage = (
  message: ResultMessage,
): ResultMessageSummary => {
  const isSuccess = message.subtype === 'success';

  return {
    errorMessage: resolveResultErrorMessage(message, isSuccess),
    numTurns: message.num_turns,
    permissionDenials: message.permission_denials,
    success: isSuccess,
    totalCostUsd: message.total_cost_usd,
  };
};

/**
 * Loads the real SKILL.md (TECH_SPEC §2.6), runs an actual Agent SDK
 * session with cwd = targetProjectPath and a tool allowlist derived from
 * the skill's own `allowed-tools:` frontmatter, streams progress, then
 * verifies the expected output files exist. Applies to fallow (triage
 * step only), code-smell-checker, code-smell-zen — not linter-checker,
 * which is fully deterministic (TECH_SPEC §2.5).
 */
export const runSkillAgent = async (
  args: RunSkillAgentArgs,
): Promise<RunSkillAgentResult> => {
  assertSafeTargetPath(args.targetProjectPath);

  const { body, frontmatter } = loadSkillFrontmatter({
    skillPath: args.skillPath,
  });
  const skillAllowedTools = deriveAllowedTools({ frontmatter });
  // Write is deliberately NOT granted via allowedTools/settings.permissions —
  // 6 live runs (see git history for the earlier 4 permission-syntax
  // attempts) converged on a much bigger discovery than any syntax fix:
  // Write/Edit always route through the SDK's "ask" path, which is only
  // ever resolved by a `canUseTool` callback (below) — no static allow
  // pattern of any shape (`allowedTools`, or the Settings-shaped
  // `settings.permissions.allow` that `.claude/settings.json` uses) grants
  // it, in ANY permissionMode, including 'dontAsk'. Confirmed empirically:
  // `permissionMode: 'dontAsk'` auto-denies the entire "ask" path *without
  // ever invoking canUseTool at all* — matching the SDK's own
  // `tool_use_denied` doc comment, which lists "dontAsk mode" as one of
  // several deny short-circuits distinct from "the 'ask' path" that
  // canUseTool handles. `permissionMode: 'default'` + a `canUseTool`
  // callback is the only combination that ever actually got a Write call
  // approved in isolation. Bash, by contrast, IS resolved via static
  // allowedTools patterns without ever reaching canUseTool (confirmed by
  // logging canUseTool invocations in the same live test) — so the
  // skill's own frontmatter-derived Bash/Read/Grep/Glob patterns stay on
  // `allowedTools` unchanged; only Write moves to `canUseTool`.
  const allowedTools = [...skillAllowedTools];

  const canUseTool: CanUseTool = async (toolName, input) => {
    if (
      toolName === 'Write' &&
      typeof input.file_path === 'string' &&
      input.file_path.startsWith(`${args.outputDirectory}/`)
    ) {
      return { behavior: 'allow', updatedInput: input };
    }

    return {
      behavior: 'deny',
      message: `${toolName} is not permitted in this unattended scan session.`,
    };
  };

  // 5th run (Write path-scoping fix in place): completed 'success' but took
  // ~38 minutes instead of ~1-2 like every prior run, and still failed to
  // save. Two compounding causes, both fixed below rather than found by
  // another blind live attempt:
  // - It tried to read OUTPUT_DIR via `echo`/`printenv` — neither is in the
  //   skill's allowed Bash commands (only cat/date/git/mkdir/node/tee), so
  //   that always fails. It then fell back to the skill's own default path
  //   *inside the target repo*, outside the Write() grant → denied, exactly
  //   as designed, but for the wrong reason (it never had the real value).
  //   Fix: state the resolved output directory directly in the prompt —
  //   no need for it to introspect an env var through a restricted shell.
  // - The skill's `../code-smell-shared/*.md` links are relative to the
  //   skill file's location *inside this CQMS repo*, meaningless from
  //   `cwd = targetProjectPath` (a different, unrelated repo). It repeatedly
  //   tried whole-filesystem searches (`find /`, root Glob) hunting for
  //   them — each a real 60s ripgrep timeout, which is almost certainly
  //   where the extra ~36 minutes went. Fix: state the shared docs'
  //   absolute path directly and grant `additionalDirectories` for it, so
  //   an absolute Read succeeds immediately instead of a blind search.
  // args.skillPath is already the skill's own directory (e.g.
  // '.github/skills/code-smell-checker'), matching loadSkillFrontmatter's
  // own `join(cqmsRepoRoot, skillPath, 'SKILL.md')` — no dirname() needed.
  const skillDirectory = join(cqmsRepoRoot, args.skillPath);
  const sharedDocsDirectory = join(
    cqmsRepoRoot,
    '.github/skills/code-smell-shared',
  );
  const prompt = `You are running fully autonomously and non-interactively — there is no user to ask follow-up questions, and no further turn after this one. You must actually execute every action this skill describes, including all file-writing and shell steps (e.g. "Saving the Report") — do not just describe or summarize what you would do. Treat every imperative instruction in the skill below ("always save", "tell the user", etc.) as something you must literally do via tool calls before finishing. Use the Write tool to create report files — it is available in this session.

Your output directory for this run is exactly: ${args.outputDirectory}
Do not check an OUTPUT_DIR environment variable and do not compute your own timestamped path — use the directory above verbatim for every file you save.

This skill's own directory (for any file referenced relative to the skill, e.g. "../code-smell-shared/...") is at the absolute path: ${skillDirectory}
The shared docs directory it references is at the absolute path: ${sharedDocsDirectory}
Read these using their absolute paths directly — do not search the filesystem for them, and do not attempt relative paths like "../code-smell-shared/SCHEMA_V1.md" since your working directory is the project being scanned, not this path.

${body}${
    args.scopeArgument
      ? `\n\n---\n\nUser-provided scope/arguments: ${args.scopeArgument}`
      : ''
  }`;

  let totalCostUsd: number | undefined;
  let numTurns: number | undefined;
  let isSuccess = false;
  let errorMessage: string | undefined;
  let permissionDenials: readonly unknown[] = [];

  try {
    for await (const message of query({
      options: {
        additionalDirectories: [skillDirectory, sharedDocsDirectory],
        allowedTools: [...allowedTools],
        canUseTool,
        cwd: args.targetProjectPath,
        // Small required deviation (TECH_SPEC §2.6): the 3 Agent-SDK-driven
        // skills honor a pre-set OUTPUT_DIR, falling back to their own
        // timestamped path only when it's absent — otherwise a UI-triggered
        // scan of another project would write CQMS scratch files into that
        // project's own working tree.
        env: { ...process.env, OUTPUT_DIR: args.outputDirectory },
        maxTurns: MAX_TURNS,
        // NOT 'dontAsk' — see the canUseTool comment above. 'default' is
        // what actually invokes canUseTool instead of silently short-
        // circuiting the ask path; canUseTool fully replaces any
        // interactive prompt, so this never blocks on stdin.
        permissionMode: 'default',
      },
      prompt,
    })) {
      if (message.type === 'result') {
        ({
          errorMessage,
          numTurns,
          permissionDenials,
          success: isSuccess,
          totalCostUsd,
        } = summarizeResultMessage(message));
      }

      args.onProgress?.(describeMessage(message));
    }
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  // Only surfaced when the run itself failed — a handful of denied Bash/Edit
  // calls the agent worked around on its own (e.g. it tried Edit, got
  // denied, and used Write instead) are not failures and shouldn't populate
  // errorMessage on an otherwise-successful run. Per-run denial counts are
  // exactly the kind of thing the health_metrics telemetry work (tracked
  // separately) should capture instead of overloading errorMessage with it.
  if (!isSuccess && permissionDenials.length > 0) {
    errorMessage ??= `Tool calls were denied: ${JSON.stringify(permissionDenials)}`;
  }

  const reportMarkdownPath = join(args.outputDirectory, 'report.md');
  const reportJsonPath = join(args.outputDirectory, 'report.json');

  if (
    isSuccess &&
    (!existsSync(reportMarkdownPath) || !existsSync(reportJsonPath))
  ) {
    isSuccess = false;
    errorMessage ??=
      'Agent session completed but expected output files are missing.';
  }

  return {
    errorMessage,
    numTurns,
    reportJsonPath: existsSync(reportJsonPath) ? reportJsonPath : undefined,
    reportMarkdownPath: existsSync(reportMarkdownPath)
      ? reportMarkdownPath
      : undefined,
    success: isSuccess,
    totalCostUsd,
  };
};
