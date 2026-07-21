#!/usr/bin/env node
/**
 * Claude Code PreToolUse secrets guard — blocks reading/writing secrets.
 *
 * Why this exists: AGENTS.md §6 says "never commit .env files or credentials",
 * but nothing enforced it at the Claude Code tool boundary (ADR-020's guard
 * covers only the agent-runner SDK runtime). This command hook denies, before
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
 * `node scripts/claude-secrets-guard.mjs --selftest` runs the built-in
 * assertion matrix (mirrors the ADR-020 tests) and exits non-zero on any
 * regression — the gate runs it so the policy can never silently rot.
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

// ---- self-test matrix -------------------------------------------------------

// Split so this file is not itself a hit for its own patterns.
const AKIA = `AKIA${'IOSFODNN7EXAMPLE'}`;
const GHP = `ghp_${'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8'}`;
// Split like the two above, and for the same reason: whole, this is a 24-char
// high-entropy token and a secret scanner flags the fixture as a leak. The
// runtime value is unchanged, so the self-test still exercises a realistic one.
const SECRET = `aZ3x9Kp2${'Qw7Lm4Rt8Nv6Bs1'}`;

// [toolName, toolInput] tuples — all PreToolUse events.
const DENY_CASES = [
  ['Read', { file_path: '/t/docker/local/.env' }],
  ['Read', { file_path: '/t/certs/server.pem' }],
  ['Read', { file_path: '/home/u/.ssh/id_rsa' }],
  ['Bash', { command: 'cat .env.local' }],
  ['Grep', { glob: '.env', path: '.' }],
  ['Write', { file_path: 'src/c.ts', content: `k = "${AKIA}"` }],
  ['Write', { file_path: 'src/c.ts', content: `t = "${GHP}"` }],
  [
    'Write',
    { file_path: 'src/x.ts', content: '-----BEGIN RSA PRIVATE KEY-----' },
  ],
  ['Edit', { file_path: 'src/x.ts', new_string: `const token = "${SECRET}";` }],
  [
    'MultiEdit',
    {
      file_path: 'src/x.ts',
      edits: [{ new_string: 'const ok = 1;' }, { new_string: `k = "${AKIA}"` }],
    },
  ],
];
const ALLOW_CASES = [
  ['Read', { file_path: '/t/.env.example' }],
  ['Read', { file_path: '/t/src/app.ts' }],
  ['Bash', { command: 'cat .env.example' }],
  ['Bash', { command: 'npm run build' }],
  ['Grep', { pattern: '.env', path: 'src' }],
  ['Write', { file_path: '.env.example', content: 'API_KEY=your-key-here' }],
  [
    'Edit',
    { file_path: 'src/x.test.ts', new_string: `const token = "${SECRET}";` },
  ],
  [
    'Write',
    {
      file_path: 'src/x.ts',
      content: `const token = "${SECRET}"; // gitleaks:allow`,
    },
  ],
];

const decisionFor = ({ event = 'PreToolUse', toolInput, toolName }) =>
  evaluatePreToolUse({ hookEventName: event, toolInput, toolName }).decision;

const runCases = (cases, want) =>
  cases.map(([toolName, toolInput]) => ({
    label: `${want} ${toolName} ${JSON.stringify(toolInput).slice(0, 44)}`,
    ok: decisionFor({ toolInput, toolName }) === want,
  }));

const runSelftest = () => {
  const results = [
    ...runCases(DENY_CASES, 'deny'),
    ...runCases(ALLOW_CASES, 'allow'),
    {
      label: 'non-PreToolUse event passthrough',
      ok:
        decisionFor({
          event: 'PostToolUse',
          toolInput: { file_path: '/t/.env' },
          toolName: 'Read',
        }) === 'allow',
    },
  ];
  for (const result of results) {
    console.log(`${result.ok ? 'PASS' : 'FAIL'}  ${result.label}`);
  }
  const passed = results.filter((result) => result.ok).length;
  console.log(`\n${passed}/${results.length} self-test cases passed`);
  return passed === results.length ? 0 : 1;
};

if (process.argv.includes('--selftest')) {
  process.exitCode = runSelftest();
} else {
  try {
    runHook();
  } catch {
    // A malformed payload or unreadable stdin must never break the tool flow.
  }
  process.exitCode = 0;
}
