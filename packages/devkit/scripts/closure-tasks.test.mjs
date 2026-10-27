import { describe, expect, test } from 'vite-plus/test';

import { taskInvocations } from './closure-tasks.mjs';
import { analyseClosure } from './closure.mjs';

const lines = (...texts) =>
  texts.map((text, index) => ({ line: index + 1, text }));

const analyse = ({ allowedTasks, files, runPrefixes }) =>
  analyseClosure({
    allowedCommands: ['git', 'node', 'npm', 'sh'],
    allowedTasks,
    files,
    hookDirectory: '.githooks',
    rootDirectory: '',
    runPrefixes,
    shipped: new Set(files.map((file) => file.path)),
  }).escapes.filter((finding) => finding.kind === 'task');

const SKILL = 'skills/sample/SKILL.md';

describe('taskInvocations', () => {
  test('reads the task after every runner, past an environment assignment', () => {
    expect(
      taskInvocations({
        lines: lines(
          'npm run lint && pnpm run build',
          'CI=1 yarn run test:all',
          'bun run dev; vp run check',
          '{{commands.run}} adr:verify',
        ),
      }),
    ).toEqual([
      { line: 1, task: 'lint' },
      { line: 1, task: 'build' },
      { line: 2, task: 'test:all' },
      { line: 3, task: 'dev' },
      { line: 3, task: 'check' },
      { line: 4, task: 'adr:verify' },
    ]);
  });

  test('skips an option, a placeholder and a bare runner', () => {
    expect(
      taskInvocations({
        lines: lines(
          'npm run --workspace web build',
          'npm run <task>',
          'npm run $TASK',
          'npm test',
          'npm run',
        ),
      }),
    ).toEqual([]);
  });

  test('reads a configured prefix that is not a known runner', () => {
    expect(
      taskInvocations({
        lines: lines('pnpm lint:check'),
        prefixes: ['pnpm'],
      }),
    ).toEqual([{ line: 1, task: 'lint:check' }]);
  });
});

describe('a task a shipped file runs', () => {
  test('is an escape when nothing shipped defines it, inline or fenced', () => {
    const escapes = analyse({
      allowedTasks: ['commit:verify'],
      files: [
        {
          content: [
            'Run `npm run harness:verify` first.',
            '',
            '```bash',
            'npm run fallow:dead-code:verify',
            '```',
          ].join('\n'),
          path: SKILL,
        },
      ],
    });

    expect(escapes).toEqual([
      { file: SKILL, kind: 'task', line: 1, reference: 'harness:verify' },
      {
        file: SKILL,
        kind: 'task',
        line: 4,
        reference: 'fallow:dead-code:verify',
      },
    ]);
  });

  test('passes when the shipped set defines it', () => {
    expect(
      analyse({
        allowedTasks: ['commit:verify', 'branch:verify'],
        files: [
          {
            content:
              'Run `npm run commit:verify` and `{{commands.run}} branch:verify`.',
            path: SKILL,
          },
        ],
      }),
    ).toEqual([]);
  });

  test('is read from a workflow step and a hook, not from their comments', () => {
    const escapes = analyse({
      allowedTasks: [],
      files: [
        {
          content: [
            'jobs:',
            '  check:',
            '    steps:',
            '      # a configured `npm run licenses:check` is ordinary',
            '      - run: npm run harness:verify',
          ].join('\n'),
          path: '.github/workflows/check.yml',
        },
        {
          content: [
            '#!/usr/bin/env sh',
            '# `npm run lint && npm test` is a value a consumer writes',
            'npm run scripts:verify',
          ].join('\n'),
          path: '.githooks/pre-push',
        },
      ],
    });

    expect(escapes.map((finding) => [finding.file, finding.reference])).toEqual(
      [
        ['.github/workflows/check.yml', 'harness:verify'],
        ['.githooks/pre-push', 'scripts:verify'],
      ],
    );
  });

  test('is not read from a comment that a separator would split, in any reader', () => {
    expect(
      analyse({
        allowedTasks: [],
        files: [
          {
            content: ['```bash', '# tidy up && pnpm run build', '```'].join(
              '\n',
            ),
            path: SKILL,
          },
          {
            content: [
              'jobs:',
              '  check:',
              '    steps:',
              '      - run: |',
              '          # lint first; npm run harness:verify',
              '          echo done',
            ].join('\n'),
            path: '.github/workflows/check.yml',
          },
          {
            content: [
              '#!/usr/bin/env sh',
              '# lint first; npm run harness:verify',
            ].join('\n'),
            path: '.githooks/pre-push',
          },
        ],
      }),
    ).toEqual([]);
  });

  test('is not judged when the caller defines no tasks', () => {
    expect(
      analyse({
        allowedTasks: undefined,
        files: [{ content: '`npm run harness:verify`', path: SKILL }],
      }),
    ).toEqual([]);
  });
});
