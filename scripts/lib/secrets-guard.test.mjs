import { describe, expect, it } from 'vite-plus/test';

import { evaluatePreToolUse } from './secrets-guard.mjs';

const AKIA = `AKIA${'IOSFODNN7EXAMPLE'}`;
const GHP = `ghp_${'A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8'}`;
const ENTROPY_FIXTURE = `aZ3x9Kp2${'Qw7Lm4Rt8Nv6Bs1'}`;
const PRIVATE_KEY_HEADER = `-----BEGIN RSA ${'PRIVATE KEY'}-----`;

const decisionFor = ({ event = 'PreToolUse', toolInput, toolName }) =>
  evaluatePreToolUse({ hookEventName: event, toolInput, toolName }).decision;

const label = ([toolName, toolInput]) =>
  `${toolName} ${JSON.stringify(toolInput).slice(0, 60)}`;

const DENY_CASES = [
  ['Read', { file_path: '/t/docker/local/.env' }],
  ['Read', { file_path: '/t/certs/server.pem' }],
  ['Read', { file_path: '/home/u/.ssh/id_rsa' }],
  ['Bash', { command: 'cat .env.local' }],
  // A quoted span is tested whole, so a quoted PATH is still caught — the
  // prose relaxation must not become "anything in quotes is fine".
  ['Bash', { command: 'cat "my file.env"' }],
  // An ambiguous bare word still counts once it carries a directory, which is
  // how the real files are always spelled.
  ['Bash', { command: 'cat ~/.aws/credentials' }],
  ['Bash', { command: 'cat ./credentials' }],
  // Unambiguous names are unaffected by the bare-word rule.
  ['Bash', { command: 'cat .npmrc' }],
  ['Grep', { glob: '.env', path: '.' }],
  // Read declares its path, so the bare spelling is still a path there.
  ['Read', { file_path: 'credentials' }],
  // The env-chain relief is an allowlist of code spellings, NOT the shape
  // `<anything>.env` — these are ordinary spellings of a real env file and must
  // stay denied. Relaxing to the shape would take all four with it.
  ['Bash', { command: 'cat prod.env' }],
  ['Bash', { command: 'cat secrets.env' }],
  ['Bash', { command: 'cat dev.env' }],
  ['Bash', { command: 'cat config/dev.env' }],
  ['Bash', { command: 'cat .env' }],
  // ...and it is Bash-only, for the same reason the bare-word rule is.
  ['Read', { file_path: 'foo.env' }],
  // Only the .env family relaxes. `server.key` is the property-access shape too,
  // but key material has no prose or code spelling to be confused with.
  ['Bash', { command: 'cat server.key' }],
  // Dropping a `:line` reference must not promote a real env file to a template.
  ['Bash', { command: 'cat .env:11' }],
  ['Write', { content: `k = "${AKIA}"`, file_path: 'src/c.ts' }],
  ['Write', { content: `t = "${GHP}"`, file_path: 'src/c.ts' }],
  ['Write', { content: PRIVATE_KEY_HEADER, file_path: 'src/x.ts' }],
  [
    'Edit',
    {
      file_path: 'src/x.ts',
      new_string: `const token = "${ENTROPY_FIXTURE}";`,
    },
  ],
  [
    'MultiEdit',
    {
      edits: [{ new_string: 'const ok = 1;' }, { new_string: `k = "${AKIA}"` }],
      file_path: 'src/x.ts',
    },
  ],
  // The module-specifier carve-out must not blind the rest of its line: an
  // import and a real assignment can share one line.
  [
    'Write',
    {
      content: `import { a } from './secret-store.util'; const t = "${ENTROPY_FIXTURE}";`,
      file_path: 'src/x.ts',
    },
  ],
];

const ALLOW_CASES = [
  ['Read', { file_path: '/t/.env.example' }],
  ['Read', { file_path: '/t/src/app.ts' }],
  ['Bash', { command: 'cat .env.example' }],
  ['Bash', { command: 'npm run build' }],
  // Prose that merely mentions a credential file is not a read of one. Each of
  // these was denied before (#278): a quoted span used to be split into its
  // words, so every word of a commit message or PR title became a candidate
  // path.
  [
    'Bash',
    { command: 'git commit -m "stop reading import paths as credentials"' },
  ],
  ['Bash', { command: 'gh pr create --title "handle credentials safely"' }],
  ['Bash', { command: "grep -rn 'credentials' scripts/lib/guard.mjs" }],
  ['Bash', { command: 'node -e \'console.log("credentials")\'' }],
  ['Grep', { path: 'src', pattern: '.env' }],
  // The runtime env objects are code, not paths, and reading them as filenames
  // denied these outright — ordinary commands in a Vite/React repo, with no
  // heredoc and no quoting involved. The last two pin the rest of the allowlist,
  // which this repo does not use but which costs nothing to keep correct.
  ['Bash', { command: 'grep -rn process.env src/' }],
  ['Bash', { command: 'grep -rn import.meta.env packages/' }],
  ['Bash', { command: 'grep -rn globalThis.process.env src/' }],
  ['Bash', { command: 'grep -rn Deno.env src/' }],
  // A `file:line` reference to the template. The carve-out this module's deny
  // message advertises used to read the suffix as `.example:11` and deny it.
  ['Bash', { command: 'echo see .env.example:11 for the shape' }],
  ['Bash', { command: 'sed -n 11p .env.example' }],
  ['Write', { content: 'API_KEY=your-key-here', file_path: '.env.example' }],
  [
    'Edit',
    {
      file_path: 'src/x.test.ts',
      new_string: `const token = "${ENTROPY_FIXTURE}";`,
    },
  ],
  [
    'Write',
    {
      content: `const token = "${ENTROPY_FIXTURE}"; // gitleaks:allow`,
      file_path: 'src/x.ts',
    },
  ],
  // Importing a secret-related module is not a leak (#276). These are the real
  // specifiers from committed source files, which the generic rule read as
  // high-entropy values because their line also contains "secret"/"token".
  [
    'Write',
    {
      content:
        "import { isSecretHashValid } from '@lcabrera/server/crypto/is-secret-hash-valid.util';",
      file_path: 'src/auth/verifyCredentials.util.ts',
    },
  ],
  [
    'Write',
    {
      content:
        "import { generateApiToken } from '@lcabrera/server/tokens/generate-api-token.util';",
      file_path: 'src/routes/login/login.action.ts',
    },
  ],
  [
    'Write',
    {
      content:
        "const { hashSecret } = await import('@lcabrera/server/crypto/hash-secret.util');",
      file_path: 'src/x.ts',
    },
  ],
];

describe('evaluatePreToolUse — denies', () => {
  it.each(DENY_CASES.map((c) => [label(c), c]))(
    '%s',
    (_name, [toolName, toolInput]) => {
      expect(decisionFor({ toolInput, toolName })).toBe('deny');
    },
  );
});

describe('evaluatePreToolUse — allows', () => {
  it.each(ALLOW_CASES.map((c) => [label(c), c]))(
    '%s',
    (_name, [toolName, toolInput]) => {
      expect(decisionFor({ toolInput, toolName })).toBe('allow');
    },
  );
});

const HOOK_PATH = '$CLAUDE_PROJECT_DIR/scripts/claude-secrets-guard';

describe('source-file paths are not credentials', () => {
  const allowed = [
    `"command": "node \\"${HOOK_PATH}.mjs\\""`,
    'const secretGuard = "./scripts/lib/secrets-guard.mjs";',
    'password_helper: "packages/server/src/crypto/hash-password.util.ts"',
    '"token_fixture": "apps/showcase/src/routes/api/token-refresh.util.ts"',
    String.raw`const secretPath = "C:\scripts\claude-secrets-guard.mjs";`,
    `const secretKeyPath = "${HOOK_PATH}.mjs";`,
  ];

  it.each(allowed)('allows %s', (line) => {
    expect(
      decisionFor({
        toolInput: { content: line, file_path: 'src/x.ts' },
        toolName: 'Write',
      }),
    ).toBe('allow');
  });

  const denied = [
    `const secretKeyPath = "${HOOK_PATH}.pem";`,
    `const secret = "${ENTROPY_FIXTURE}";`,
    `const p = "./scripts/x.mjs"; const secret = "${ENTROPY_FIXTURE}";`,
    `const secret = "${ENTROPY_FIXTURE}/x.ts";`,
    `const secret = "${AKIA}/x.ts";`,
    `const secret = "${ENTROPY_FIXTURE}.ts";`,
  ];

  it.each(denied)('still denies %s', (line) => {
    expect(
      decisionFor({
        toolInput: { content: line, file_path: 'src/x.ts' },
        toolName: 'Write',
      }),
    ).toBe('deny');
  });
});

describe('evaluatePreToolUse — event scope', () => {
  it('passes through any event that is not PreToolUse', () => {
    expect(
      decisionFor({
        event: 'PostToolUse',
        toolInput: { file_path: '/t/.env' },
        toolName: 'Read',
      }),
    ).toBe('allow');
  });
});

describe('heredoc bodies — a deliberate gap, pinned', () => {
  it('denies prose in a heredoc that names a secret file', () => {
    expect(
      decisionFor({
        toolInput: {
          command:
            'git commit -F - <<EOF\nfix: a real .env read is denied\nEOF',
        },
        toolName: 'Bash',
      }),
    ).toBe('deny');
  });

  it('allows the same prose as a quoted -m argument', () => {
    expect(
      decisionFor({
        toolInput: { command: 'git commit -m "a real .env read is denied"' },
        toolName: 'Bash',
      }),
    ).toBe('allow');
  });

  it('denies a heredoc piped into a shell, which is why the gap stays', () => {
    expect(
      decisionFor({
        toolInput: { command: 'bash <<EOF\ncat docker/local/.env\nEOF' },
        toolName: 'Bash',
      }),
    ).toBe('deny');
  });

  it('allows the prescribed workaround — pass the message by path', () => {
    expect(
      decisionFor({
        toolInput: { command: 'git commit -F /tmp/message.txt' },
        toolName: 'Bash',
      }),
    ).toBe('allow');
  });
});

describe('the deny reason', () => {
  it('names the offending path so the caller can tell which token tripped it', () => {
    const result = evaluatePreToolUse({
      hookEventName: 'PreToolUse',
      toolInput: { file_path: '/t/docker/local/.env' },
      toolName: 'Read',
    });

    expect(result.decision).toBe('deny');
    expect(result.reason).toContain('.env');
  });
});
