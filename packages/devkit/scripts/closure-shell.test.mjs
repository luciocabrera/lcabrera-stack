import { describe, expect, test } from 'vite-plus/test';

import { analyseClosure } from './closure.mjs';

const HOOKS = '.githooks';

const analyse = ({ files, hookDirectory = HOOKS, present = [] }) =>
  analyseClosure({
    allowedBins: ['repo-verify-commit'],
    allowedCommands: ['git', 'node', 'sh'],
    exists: (candidate) => present.includes(candidate),
    files,
    hookDirectory,
    rootDirectory: '',
    shipped: new Set(files.map((file) => file.path)),
  });

const hook = (lines) => ({
  content: ['#!/usr/bin/env sh', ...lines].join('\n'),
  path: `${HOOKS}/commit-msg`,
});

describe('hook seeds', () => {
  test('a script that exists only in the source repository is an escape', () => {
    const { escapes } = analyse({
      files: [hook(['node scripts/verify-seeds.mjs', 'exit 0'])],
      present: ['scripts/verify-seeds.mjs'],
    });

    expect(escapes).toEqual([
      {
        file: `${HOOKS}/commit-msg`,
        kind: 'link',
        line: 2,
        reference: 'scripts/verify-seeds.mjs',
        resolved: 'scripts/verify-seeds.mjs',
      },
    ]);
  });

  test('a script that exists nowhere is missing', () => {
    const { escapes } = analyse({
      files: [hook(['node scripts/gone.mjs || exit 1'])],
    });

    expect(escapes).toEqual([
      {
        file: `${HOOKS}/commit-msg`,
        kind: 'missing',
        line: 2,
        reference: 'scripts/gone.mjs',
      },
    ]);
  });

  test('a script the shipped set carries is answered', () => {
    const { escapes } = analyse({
      files: [
        hook(['node scripts/hooks-path.mjs']),
        { content: 'export {};\n', path: 'scripts/hooks-path.mjs' },
      ],
    });

    expect(escapes).toEqual([]);
  });

  test('a runner outside the allowed commands is reported', () => {
    const { escapes } = analyse({
      files: [hook(['pnpm run lint'])],
    });

    expect(escapes.map((finding) => finding.kind)).toEqual(['command']);
  });

  test('a path named in a comment is not run, so it is not read', () => {
    const { escapes } = analyse({
      files: [
        hook([
          '# node scripts/verify-seeds.mjs once ran here',
          'exit 0  # node scripts/verify-seeds.mjs',
        ]),
      ],
      present: ['scripts/verify-seeds.mjs'],
    });

    expect(escapes).toEqual([]);
  });

  test('a shell script outside the hook directory is read by its shebang', () => {
    const { escapes, unchecked } = analyse({
      files: [
        {
          content: '#!/bin/bash\nnode scripts/verify-seeds.mjs\n',
          path: 'tools/check',
        },
      ],
      present: ['scripts/verify-seeds.mjs'],
    });

    expect(escapes.map((finding) => finding.kind)).toEqual(['link']);
    expect(unchecked).toEqual([]);
  });

  test('an unmarked file outside the hook directory is not read', () => {
    const { escapes, unchecked } = analyse({
      files: [
        { content: 'node scripts/gone.mjs\n', path: `${HOOKS}/pre-push` },
      ],
      hookDirectory: 'hooks',
    });

    expect(escapes).toEqual([]);
    expect(unchecked).toEqual([`${HOOKS}/pre-push`]);
  });
});

describe('a file in the hook directory that is not a shell script', () => {
  test('a README there is prose, not a script', () => {
    const { escapes, unchecked } = analyse({
      files: [
        {
          content: '# Hooks\n\nThe hook runs scripts/local-only.mjs first.\n',
          path: `${HOOKS}/README.md`,
        },
      ],
      present: ['scripts/local-only.mjs'],
    });

    expect(escapes).toEqual([]);
    expect(unchecked).toEqual([]);
  });

  test('a hook with another interpreter is left unchecked', () => {
    const { escapes, unchecked } = analyse({
      files: [
        {
          content: '#!/usr/bin/env node\nnode scripts/gone.mjs\n',
          path: `${HOOKS}/pre-push`,
        },
      ],
    });

    expect(escapes).toEqual([]);
    expect(unchecked).toEqual([`${HOOKS}/pre-push`]);
  });

  test('a sample with a shell shebang is still read by it', () => {
    const { escapes } = analyse({
      files: [
        {
          content: '#!/bin/sh\nnode scripts/gone.mjs\n',
          path: `${HOOKS}/pre-push.sample`,
        },
      ],
    });

    expect(escapes.map((finding) => finding.kind)).toEqual(['missing']);
  });
});

describe('the files no resolver reads', () => {
  const files = [
    { content: '# Notes\n', path: 'docs/notes.md' },
    { content: 'export {};\n', path: 'src/index.ts' },
    { content: 'jobs:\n  check:\n', path: '.github/workflows/check.yml' },
    hook(['exit 0']),
    { content: 'services:\n  db:\n', path: 'docker/compose.yml' },
    { content: '{}\n', path: 'biome.jsonc' },
    { content: 'select 1;\n', path: 'db/setup.sql' },
  ];

  test('are listed, sorted, and nothing a resolver reads is among them', () => {
    expect(analyse({ files }).unchecked).toEqual([
      'biome.jsonc',
      'db/setup.sql',
      'docker/compose.yml',
    ]);
  });

  test('do not count as escapes', () => {
    expect(analyse({ files }).escapes).toEqual([]);
  });
});
