#!/usr/bin/env node
/**
 * Claude Code PreToolUse secrets guard — blocks reading/writing secrets.
 *
 * Why this exists: AGENTS.md §6 says "never commit .env files or credentials",
 * but nothing enforced it at the Claude Code tool boundary (ADR-020's guard
 * predates the interactive CLI). This command hook denies, before
 * the tool runs:
 *   - Read/Grep/Glob or a Bash command that would read a secret/.env file
 *     (exception: .example/.sample/.template templates), and
 *   - Write/Edit/MultiEdit whose content introduces a credential.
 *
 * All logic is the pure `evaluatePreToolUse` in ./lib/secrets-guard.mjs; this
 * file is the thin shell: read the PreToolUse JSON from stdin, and on a deny
 * emit the modern decision object
 *   {"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny",...}}
 * (the shape ADR-020's SDK guard proves works — an `exit 1` does NOT block a
 * PreToolUse call). An allow is a silent `exit 0`, so normal permission flow
 * continues untouched.
 *
 * The assertion matrix lives in `lib/secrets-guard.test.mjs`, so `test:scripts`
 * runs it and `test:ci` runs that. It used to sit here behind a `--selftest`
 * flag that nothing invoked, while this header claimed the gate ran it — a
 * guard for the guard that only ever fired when a human typed the command.
 *
 * Governed by .claude/rules/scripts.md.
 */
import { readFileSync } from 'node:fs';

import { evaluatePreToolUse } from './lib/secrets-guard.mjs';

const STDIN_FD = 0;

const emitDecision = (result) => {
  if (result.decision !== 'deny') {
    return; // allow → stay silent, exit 0, let normal permission flow continue
  }
  const output = {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: result.reason,
    },
  };
  process.stdout.write(`${JSON.stringify(output)}\n`);
};

const runHook = () => {
  const payload = JSON.parse(readFileSync(STDIN_FD, 'utf8'));
  emitDecision(
    evaluatePreToolUse({
      hookEventName: payload?.hook_event_name,
      toolInput: payload?.tool_input,
      toolName: payload?.tool_name,
    }),
  );
};

try {
  runHook();
} catch {
  // A malformed payload or unreadable stdin must never break the tool flow.
}
process.exitCode = 0;
