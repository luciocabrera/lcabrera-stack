import type {
  HookCallback,
  HookJSONOutput,
} from '@anthropic-ai/claude-agent-sdk';

import { collectToolInputPaths } from './collectToolInputPaths.util.ts';
import { isSecretFilePath } from './isSecretFilePath.util.ts';

const NO_OPINION: HookJSONOutput = {};

/**
 * PreToolUse hook denying an unattended scan session any Read/Glob/Grep/
 * Bash access to credential-bearing files (ADR-020). A hook is the ONLY
 * interception point that works here: statically-allowed tools never
 * reach `canUseTool` (the SDK resolves them before the ask path — the
 * empirically-verified behavior documented in runSkillAgent), so an
 * allowlisted `Read`/`Bash(cat:*)` would otherwise read `.env` freely.
 * Self-scan (target = the CQMS repo itself) is what makes this real:
 * docker/local/.env in the target IS the live DB credential.
 *
 * Defense-in-depth note: broad content searches are already covered by
 * ripgrep's gitignore handling (real env files are gitignored); this hook
 * closes the explicit-path route. A deny is a normal, non-fatal event —
 * the agent works around it, and runSkillAgent only surfaces denials on
 * otherwise-failed runs.
 */
export const secretFileGuardHook: HookCallback = async (input) => {
  if (input.hook_event_name !== 'PreToolUse') {
    return NO_OPINION;
  }

  const candidates = collectToolInputPaths({
    toolInput: input.tool_input,
    toolName: input.tool_name,
  });
  const secretCandidate = candidates.find((candidate) =>
    isSecretFilePath(candidate),
  );
  if (secretCandidate === undefined) {
    return NO_OPINION;
  }

  return {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: `Access to secret files is not permitted in unattended scan sessions (blocked path: ${secretCandidate}). Continue the scan without reading this file.`,
    },
  };
};
