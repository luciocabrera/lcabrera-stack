import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { query } from '@anthropic-ai/claude-agent-sdk';

import type {
  RunSkillAgentArgs,
  RunSkillAgentResult,
} from './runSkillAgent.types.ts';

import { assertSafeTargetPath } from './assertSafeTargetPath.util.ts';
import { deriveAllowedTools } from './deriveAllowedTools.util.ts';
import { loadSkillFrontmatter } from './skillFrontmatter.util.ts';

const describeMessage = (message: { type: string }): string =>
  'subtype' in message
    ? `${message.type}:${(message as { subtype: string }).subtype}`
    : message.type;

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
  // `Write` is granted here unconditionally, on top of the skill's own
  // frontmatter — discovered empirically across three live runs that this
  // is genuinely required, not an oversight to route around:
  // 1st run: completed 'success' with real turns/cost but never invoked
  //    any tool to save anything — the model treated "Saving the Report"
  //    as descriptive rather than mandatory. Fixed with the prompt preamble.
  // 2nd run: correctly attempted to save, tried `Write` (denied — not in
  //    the skill's own frontmatter) then `printf`/`echo` (also denied, not
  //    allowlisted) — never tried the one thing nominally granted
  //    (`cat`/`tee` via Bash).
  // 3rd run (after prompting it toward `cat > file <<'EOF'`): it did try
  //    exactly that heredoc form — and it was STILL denied. Claude Code's
  //    permission system gates any Bash command containing output
  //    redirection as its own capability, independent of the `cat:*`/
  //    `tee:*` command-prefix allowlist — a real, separate security
  //    boundary, not a bug to work around.
  // 4th run (bare 'Write' added to allowedTools): STILL denied. Write/Edit
  //    are path-scoped tools, not bare-name tools — this repo's OWN
  //    .claude/settings.json already shows the real syntax
  //    (`"Write(.tmp/**)"`, `"Edit(.tmp/**)"`), the same `Tool(pattern)`
  //    shape Bash uses. A bare `'Write'` string matches nothing.
  //    `Write(${outputDirectory}/**)` is the correct grant — scoped to
  //    exactly the one directory this session should ever write to, which
  //    is also a real security property, not just a syntax fix.
  const allowedTools = [
    ...skillAllowedTools,
    `Write(${args.outputDirectory}/**)`,
  ];

  const prompt = `You are running fully autonomously and non-interactively — there is no user to ask follow-up questions, and no further turn after this one. You must actually execute every action this skill describes, including all file-writing and shell steps (e.g. "Saving the Report") — do not just describe or summarize what you would do. Treat every imperative instruction in the skill below ("always save", "tell the user", etc.) as something you must literally do via tool calls before finishing. Use the Write tool to create report files — it is available in this session.

${body}${
    args.scopeArgument
      ? `\n\n---\n\nUser-provided scope/arguments: ${args.scopeArgument}`
      : ''
  }`;

  let totalCostUsd: number | undefined;
  let numTurns: number | undefined;
  let success = false;
  let errorMessage: string | undefined;
  let permissionDenials: readonly unknown[] = [];

  try {
    for await (const message of query({
      options: {
        allowedTools: [...allowedTools],
        cwd: args.targetProjectPath,
        // Small required deviation (TECH_SPEC §2.6): the 3 Agent-SDK-driven
        // skills honor a pre-set OUTPUT_DIR, falling back to their own
        // timestamped path only when it's absent — otherwise a UI-triggered
        // scan of another project would write CQMS scratch files into that
        // project's own working tree.
        env: { ...process.env, OUTPUT_DIR: args.outputDirectory },
        permissionMode: 'dontAsk',
      },
      prompt,
    })) {
      if (message.type === 'result') {
        totalCostUsd = message.total_cost_usd;
        numTurns = message.num_turns;
        success = message.subtype === 'success';
        permissionDenials = message.permission_denials;
        if (!success) {
          errorMessage =
            'errors' in message && message.errors.length > 0
              ? message.errors.join('; ')
              : message.subtype;
        }
      }

      args.onProgress?.(describeMessage(message));
    }
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  if (permissionDenials.length > 0) {
    errorMessage ??= `Tool calls were denied: ${JSON.stringify(permissionDenials)}`;
  }

  const reportMarkdownPath = join(args.outputDirectory, 'report.md');
  const reportJsonPath = join(args.outputDirectory, 'report.json');

  if (
    success &&
    (!existsSync(reportMarkdownPath) || !existsSync(reportJsonPath))
  ) {
    success = false;
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
    success,
    totalCostUsd,
  };
};
