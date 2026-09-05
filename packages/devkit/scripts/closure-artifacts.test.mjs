import { describe, expect, test } from 'vite-plus/test';

import { analyseClosure } from './closure.mjs';

const analyse = ({ agentDirectory, content, path, present = [] }) =>
  analyseClosure({
    agentDirectory,
    allowedBins: ['repo-verify-commit'],
    allowedCommands: ['git', 'node'],
    exists: (candidate) => present.includes(candidate),
    files: [{ content, path }],
    rootDirectory: '',
    shipped: new Set([path]),
  }).escapes;

const kinds = (escapes) => escapes.map((finding) => finding.kind);

const references = (escapes) =>
  escapes.map((finding) => finding.resolved ?? finding.reference);

describe('workflow files', () => {
  const path = '.github/workflows/check.yml';

  test('a step running a script the consumer has not got is reported', () => {
    const escapes = analyse({
      content: [
        'jobs:',
        '  check:',
        '    steps:',
        '      - run: |',
        '          node scripts/release.mjs',
      ].join('\n'),
      path,
      present: ['scripts/release.mjs'],
    });

    expect(kinds(escapes)).toContain('link');
    expect(references(escapes)).toContain('scripts/release.mjs');
  });

  test('a step running an unanswered tool is reported', () => {
    const escapes = analyse({
      content: [
        'jobs:',
        '  check:',
        '    steps:',
        '      - run: pnpm install',
      ].join('\n'),
      path,
    });

    expect(escapes).toEqual([
      { file: path, kind: 'command', line: 4, reference: 'pnpm' },
    ]);
  });

  test('a local action is reported and a published one is not', () => {
    const escapes = analyse({
      content: [
        'jobs:',
        '  check:',
        '    steps:',
        '      - uses: actions/checkout@v5',
        '      - uses: ./.github/actions/setup',
      ].join('\n'),
      path,
    });

    expect(escapes).toEqual([
      {
        file: path,
        kind: 'link',
        line: 5,
        reference: './.github/actions/setup',
        resolved: '.github/actions/setup',
      },
    ]);
  });

  test('a secret only the consumer could set is reported', () => {
    const escapes = analyse({
      content: [
        'jobs:',
        '  check:',
        '    steps:',
        '      - env:',
        `          TOKEN: \${{ secrets.PUBLISH_TOKEN }}`,
      ].join('\n'),
      path,
    });

    expect(escapes).toEqual([
      {
        file: path,
        kind: 'secret',
        line: 5,
        reference: 'secrets.PUBLISH_TOKEN',
      },
    ]);
  });

  test('a secret with a fallback, and the automatic one, are answered', () => {
    const escapes = analyse({
      content: [
        'jobs:',
        '  check:',
        '    steps:',
        '      - env:',
        `          A: \${{ secrets.REPO_ADMIN_TOKEN || github.token }}`,
        `          B: \${{ secrets.GITHUB_TOKEN }}`,
      ].join('\n'),
      path,
    });

    expect(escapes).toEqual([]);
  });

  test('the last of a chain of secrets is answered by nothing', () => {
    const escapes = analyse({
      content: `          A: \${{ secrets.PUBLISH_TOKEN || secrets.FALLBACK_TOKEN }}\n`,
      path,
    });

    expect(kinds(escapes)).toEqual(['secret']);
    expect(references(escapes)).toEqual(['secrets.FALLBACK_TOKEN']);
  });

  test('markdown carrying the same lines is left to the markdown resolvers', () => {
    const escapes = analyse({
      content: [
        'jobs:',
        '  check:',
        '    steps:',
        '      - run: pnpm install',
      ].join('\n'),
      path: 'skills/example/SKILL.md',
    });

    expect(escapes).toEqual([]);
  });
});

describe('bin invocations', () => {
  test('an executable no gate task places is reported', () => {
    const escapes = analyse({
      content: 'exec ./node_modules/.bin/repo-verify-invented "$1"\n',
      path: 'hooks/commit-msg',
    });

    expect(escapes).toEqual([
      {
        file: 'hooks/commit-msg',
        kind: 'bin',
        line: 1,
        reference: 'repo-verify-invented',
      },
    ]);
  });

  test('one reached through a variable holding the bin directory is reported', () => {
    const escapes = analyse({
      content: [
        'jobs:',
        '  check:',
        '    env:',
        '      GATES: ./node_modules/.bin',
        '    steps:',
        '      - run: \'"$GATES/repo-verify-invented" --check\'',
      ].join('\n'),
      path: '.github/workflows/check.yml',
    });

    expect(kinds(escapes)).toEqual(['bin']);
    expect(references(escapes)).toEqual(['repo-verify-invented']);
  });

  test('an executable a gate task does place is answered', () => {
    const escapes = analyse({
      content: 'exec ./node_modules/.bin/repo-verify-commit "$1"\n',
      path: 'hooks/commit-msg',
    });

    expect(escapes).toEqual([]);
  });

  test('no roster at all leaves every invocation unanswered', () => {
    const { escapes } = analyseClosure({
      files: [
        {
          content: 'exec ./node_modules/.bin/repo-verify-invented "$1"\n',
          path: 'hooks/commit-msg',
        },
      ],
      rootDirectory: '',
      shipped: new Set(['hooks/commit-msg']),
    });

    expect(escapes).toEqual([]);
  });

  test('an empty roster answers that the install places nothing', () => {
    const { escapes } = analyseClosure({
      allowedBins: [],
      files: [
        {
          content: 'exec ./node_modules/.bin/repo-verify-commit "$1"\n',
          path: 'hooks/commit-msg',
        },
      ],
      rootDirectory: '',
      shipped: new Set(['hooks/commit-msg']),
    });

    expect(kinds(escapes)).toEqual(['bin']);
  });

  test('a name glued to the token before it binds no directory', () => {
    const escapes = analyse({
      content: ['9GATES=node_modules/.bin', 'exec "$GATES/repo-adr"'].join(
        '\n',
      ),
      path: 'hooks/commit-msg',
    });

    expect(escapes).toEqual([]);
  });
});

describe('subagent definitions', () => {
  const agentDirectory = '.claude/agents';
  const path = '.claude/agents/reviewer.md';

  test('a bare path in the frontmatter is reported', () => {
    const escapes = analyse({
      agentDirectory,
      content: [
        '---',
        'name: reviewer',
        'description: Follows docs/agents/review-contract.md to the letter.',
        '---',
        '',
        'You review.',
      ].join('\n'),
      path,
      present: ['docs/agents/review-contract.md'],
    });

    expect(escapes).toEqual([
      {
        file: path,
        kind: 'link',
        line: 3,
        reference: 'docs/agents/review-contract.md',
        resolved: 'docs/agents/review-contract.md',
      },
    ]);
  });

  test('a bare path in the body is reported', () => {
    const escapes = analyse({
      agentDirectory,
      content: [
        '---',
        'name: reviewer',
        '---',
        '',
        'Read scripts/gate.mjs first.',
      ].join('\n'),
      path,
      present: ['scripts/gate.mjs'],
    });

    expect(references(escapes)).toEqual(['scripts/gate.mjs']);
  });

  test('a path inside a fenced block is left to the markdown resolvers', () => {
    const escapes = analyse({
      agentDirectory,
      content: [
        '# Reviewer',
        '',
        '```text',
        'docs/agents/review-contract.md',
        '```',
      ].join('\n'),
      path,
      present: ['docs/agents/review-contract.md'],
    });

    expect(escapes).toEqual([]);
  });

  test('the same prose outside the agent directory is not read this way', () => {
    const escapes = analyse({
      agentDirectory,
      content: 'Read scripts/gate.mjs first.\n',
      path: 'docs/agents/notes.md',
      present: ['scripts/gate.mjs'],
    });

    expect(escapes).toEqual([]);
  });
});
