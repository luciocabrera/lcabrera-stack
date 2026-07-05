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
  const allowedTools = deriveAllowedTools({ frontmatter });

  // The skill's own Markdown body is written for an *interactive* Claude
  // Code session, where its imperative instructions ("always save without
  // prompting") carry implicit weight from the slash-command invocation
  // itself. Fed as a bare prompt to a one-shot query(), that framing is
  // lost — discovered empirically: a first live run completed with
  // subtype 'success' and real turns/cost but never actually invoked the
  // Bash tool to save anything, because the model treated "Saving the
  // Report" as descriptive rather than mandatory-to-execute. This preamble
  // makes the unattended, single-shot, must-actually-execute nature explicit.
  const prompt = `You are running fully autonomously and non-interactively — there is no user to ask follow-up questions, and no further turn after this one. You must actually execute every action this skill describes, including all file-writing and shell steps (e.g. "Saving the Report") — do not just describe or summarize what you would do. Treat every imperative instruction in the skill below ("always save", "tell the user", etc.) as something you must literally do via tool calls before finishing.

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
