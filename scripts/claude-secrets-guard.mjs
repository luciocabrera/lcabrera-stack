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

const AKIA = `AKIA${'IOSFODNN7EXAMPLE'}`; // AWS docs example key, split so this file is not itself a hit
const GHP = `ghp_${'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8'}`;
const HIGH_ENTROPY = 'aZ3x9Kp2Qw7Lm4Rt8Nv6Bs1'; // 24 mixed chars, no spaces

const SELFTEST_CASES = [
  {
    name: 'Read real .env → deny',
    event: 'PreToolUse',
    tool: 'Read',
    input: { file_path: '/t/docker/local/.env' },
    want: 'deny',
  },
  {
    name: 'Read .env.example → allow',
    event: 'PreToolUse',
    tool: 'Read',
    input: { file_path: '/t/.env.example' },
    want: 'allow',
  },
  {
    name: 'Read source file → allow',
    event: 'PreToolUse',
    tool: 'Read',
    input: { file_path: '/t/src/app.ts' },
    want: 'allow',
  },
  {
    name: 'Read *.pem → deny',
    event: 'PreToolUse',
    tool: 'Read',
    input: { file_path: '/t/certs/server.pem' },
    want: 'deny',
  },
  {
    name: 'Read id_rsa → deny',
    event: 'PreToolUse',
    tool: 'Read',
    input: { file_path: '/home/u/.ssh/id_rsa' },
    want: 'deny',
  },
  {
    name: 'Bash cat .env.local → deny',
    event: 'PreToolUse',
    tool: 'Bash',
    input: { command: 'cat .env.local' },
    want: 'deny',
  },
  {
    name: 'Bash cat .env.example → allow',
    event: 'PreToolUse',
    tool: 'Bash',
    input: { command: 'cat .env.example' },
    want: 'allow',
  },
  {
    name: 'Bash normal command → allow',
    event: 'PreToolUse',
    tool: 'Bash',
    input: { command: 'npm run build' },
    want: 'allow',
  },
  {
    name: 'Grep glob .env → deny',
    event: 'PreToolUse',
    tool: 'Grep',
    input: { glob: '.env', path: '.' },
    want: 'deny',
  },
  {
    name: 'Grep pattern ".env" in src → allow',
    event: 'PreToolUse',
    tool: 'Grep',
    input: { pattern: '.env', path: 'src' },
    want: 'allow',
  },
  {
    name: 'Write AWS key → deny',
    event: 'PreToolUse',
    tool: 'Write',
    input: { file_path: 'src/config.ts', content: `const key = "${AKIA}";` },
    want: 'deny',
  },
  {
    name: 'Write GitHub token → deny',
    event: 'PreToolUse',
    tool: 'Write',
    input: { file_path: 'src/config.ts', content: `const t = "${GHP}";` },
    want: 'deny',
  },
  {
    name: 'Write private key → deny',
    event: 'PreToolUse',
    tool: 'Write',
    input: {
      file_path: 'src/x.ts',
      content: '-----BEGIN RSA PRIVATE KEY-----\nMIIE...',
    },
    want: 'deny',
  },
  {
    name: 'Write placeholder → allow',
    event: 'PreToolUse',
    tool: 'Write',
    input: { file_path: '.env.example', content: 'API_KEY=your-key-here' },
    want: 'allow',
  },
  {
    name: 'Edit high-entropy secret → deny',
    event: 'PreToolUse',
    tool: 'Edit',
    input: {
      file_path: 'src/x.ts',
      new_string: `const token = "${HIGH_ENTROPY}";`,
    },
    want: 'deny',
  },
  {
    name: 'Edit same secret in a test file → allow',
    event: 'PreToolUse',
    tool: 'Edit',
    input: {
      file_path: 'src/x.test.ts',
      new_string: `const token = "${HIGH_ENTROPY}";`,
    },
    want: 'allow',
  },
  {
    name: 'Write secret with allow marker → allow',
    event: 'PreToolUse',
    tool: 'Write',
    input: {
      file_path: 'src/x.ts',
      content: `const token = "${HIGH_ENTROPY}"; // gitleaks:allow`,
    },
    want: 'allow',
  },
  {
    name: 'MultiEdit with a secret → deny',
    event: 'PreToolUse',
    tool: 'MultiEdit',
    input: {
      file_path: 'src/x.ts',
      edits: [
        { new_string: 'const ok = 1;' },
        { new_string: `const k = "${AKIA}";` },
      ],
    },
    want: 'deny',
  },
  {
    name: 'non-PreToolUse event → allow',
    event: 'PostToolUse',
    tool: 'Read',
    input: { file_path: '/t/.env' },
    want: 'allow',
  },
];

const runSelftest = () => {
  const results = SELFTEST_CASES.map((testCase) => {
    const { decision } = evaluatePreToolUse({
      hookEventName: testCase.event,
      toolInput: testCase.input,
      toolName: testCase.tool,
    });
    return {
      name: testCase.name,
      ok: decision === testCase.want,
      got: decision,
      want: testCase.want,
    };
  });
  for (const result of results) {
    const status = result.ok ? 'PASS' : 'FAIL';
    console.log(
      `${status}  ${result.name} (want ${result.want}, got ${result.got})`,
    );
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
