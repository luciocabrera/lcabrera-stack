import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vite-plus/test';

import { runGit } from '../../packages/repo-standards/scripts/git-exec.mjs';
import {
  createFixtureRoots,
  writeIn,
} from '../../packages/repo-standards/scripts/repo-fixtures.mjs';
import { findMissing, systemGit } from './changeset-sources.mjs';

const CLI = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'verify-changesets.mjs',
);

const fixtures = createFixtureRoots('changesets-gate-');

afterEach(fixtures.removeAll);

const manifest = (fields) => `${JSON.stringify(fields, undefined, 2)}\n`;

const PUBLIC_FILES = ['src', '!src/**/*.test.*'];

const BASE_TREE = {
  '.changeset/README.md': 'Changesets.\n',
  '.changeset/config.json': manifest({ baseBranch: 'main' }),
  'package.json': manifest({ name: 'scratch-root', private: true }),
  'packages/alpha/README.md': '# alpha\n',
  'packages/alpha/eslint.config.mjs': 'export default [];\n',
  'packages/alpha/package.json': manifest({
    files: PUBLIC_FILES,
    name: '@scratch/alpha',
    version: '0.1.0',
  }),
  'packages/alpha/src/index.mjs': 'export const alpha = 1;\n',
  'packages/alpha/src/index.test.mjs': 'export {};\n',
  'packages/beta/package.json': manifest({
    files: PUBLIC_FILES,
    name: '@scratch/beta',
    version: '0.1.0',
  }),
  'packages/beta/src/index.mjs': 'export const beta = 1;\n',
  'packages/internal/package.json': manifest({
    name: '@scratch/internal',
    private: true,
    version: '0.0.0',
  }),
  'packages/internal/src/index.mjs': 'export const internal = 1;\n',
  'pnpm-workspace.yaml': 'packages:\n  - packages/*\n',
};

const git = (root, args) =>
  runGit({
    args: [
      '-c',
      'user.name=fixture',
      '-c',
      'user.email=f@example.com',
      ...args,
    ],
    cwd: root,
  });

const commitAll = (root) => {
  git(root, ['add', '-A']);
  git(root, ['commit', '-q', '--no-verify', '-m', 'fixture']);
};

const changesetFor = (name) => `---\n'${name}': patch\n---\n\nA change.\n`;

const branchWith = ({ commit = true, edits = {}, removals = [] }) => {
  const root = fixtures.make();
  git(root, ['init', '-q', '--initial-branch=main', '.']);
  const write = writeIn(root);
  for (const [path, text] of Object.entries(BASE_TREE)) write(path, text);
  commitAll(root);
  git(root, ['checkout', '-q', '-b', 'topic']);
  for (const [path, text] of Object.entries(edits)) write(path, text);
  for (const path of removals) git(root, ['rm', '-q', path]);
  if (commit) commitAll(root);
  return root;
};

const run = (root) =>
  spawnSync(process.execPath, [CLI, '--base', 'main'], {
    cwd: root,
    encoding: 'utf8',
  });

describe('verify-changesets against a scratch workspace', () => {
  it('fails a shipped README edit with no changeset, naming the package', () => {
    const result = run(
      branchWith({ edits: { 'packages/alpha/README.md': '# alpha 2\n' } }),
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain(
      '@scratch/alpha: packages/alpha/README.md ships',
    );
  });

  it('passes the same edit once a changeset names the package', () => {
    const result = run(
      branchWith({
        edits: {
          '.changeset/alpha-readme.md': changesetFor('@scratch/alpha'),
          'packages/alpha/README.md': '# alpha 2\n',
        },
      }),
    );

    expect(result.status).toBe(0);
  });

  it('counts a changeset that is not committed yet', () => {
    const result = run(
      branchWith({
        commit: false,
        edits: {
          '.changeset/alpha-readme.md': changesetFor('@scratch/alpha'),
          'packages/alpha/README.md': '# alpha 2\n',
        },
      }),
    );

    expect(result.status).toBe(0);
  });

  it('does not accept a changeset naming a different package', () => {
    const result = run(
      branchWith({
        edits: {
          '.changeset/beta-only.md': changesetFor('@scratch/beta'),
          'packages/alpha/src/index.mjs': 'export const alpha = 2;\n',
        },
      }),
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('@scratch/alpha:');
    expect(result.stderr).not.toContain('@scratch/beta:');
  });

  it('passes a change to a test file, an unpacked config and a private package', () => {
    const result = run(
      branchWith({
        edits: {
          'packages/alpha/eslint.config.mjs': 'export default [{}];\n',
          'packages/alpha/src/index.test.mjs': 'export const probe = 1;\n',
          'packages/internal/src/index.mjs': 'export const internal = 2;\n',
        },
      }),
    );

    expect(result.status).toBe(0);
  });

  it('fails a deleted file the base tarball shipped, and passes a deleted test', () => {
    expect(
      run(branchWith({ removals: ['packages/beta/src/index.mjs'] })).stderr,
    ).toContain('@scratch/beta: packages/beta/src/index.mjs ships');
    expect(
      run(branchWith({ removals: ['packages/alpha/src/index.test.mjs'] }))
        .status,
    ).toBe(0);
  });

  it('passes a version change, which releases the package it moves', () => {
    const result = run(
      branchWith({
        edits: {
          'packages/alpha/README.md': '# alpha 2\n',
          'packages/alpha/package.json': manifest({
            files: PUBLIC_FILES,
            name: '@scratch/alpha',
            version: '0.2.0',
          }),
        },
        removals: [],
      }),
    );

    expect(result.status).toBe(0);
  });
});

describe('verify-changesets when git cannot answer', () => {
  const failingOn = (root, subcommand) => {
    const realGit = systemGit(root);
    return (args) => {
      if (args.includes(subcommand)) {
        throw new Error(`\`git ${args.join(' ')}\` failed: injected`);
      }
      return realGit(args);
    };
  };

  it.each(['merge-base', 'diff', 'ls-files', 'ls-tree', 'show', 'restore'])(
    'errors instead of passing when `git %s` fails',
    async (subcommand) => {
      const root = branchWith({ removals: ['packages/beta/src/index.mjs'] });

      await expect(
        findMissing({
          baseRef: 'main',
          gitRunner: failingOn(root, subcommand),
          root,
        }),
      ).rejects.toThrow(subcommand);
    },
  );

  it('names the command and its stderr when the base is not a commit', async () => {
    const root = branchWith({});

    await expect(findMissing({ baseRef: 'no-such-ref', root })).rejects.toThrow(
      /`git merge-base no-such-ref HEAD` failed \(.*no-such-ref/u,
    );
  });

  it('refuses a base that git would read as an option', async () => {
    const root = branchWith({});

    await expect(
      findMissing({ baseRef: '--output=/tmp/x', root }),
    ).rejects.toThrow('is not a git ref or commit');
  });

  it('reads a workspace directory the base never had as holding no package', async () => {
    const root = branchWith({
      edits: {
        'apps/site/package.json': manifest({ name: 'site', version: '0.1.0' }),
      },
    });

    await expect(findMissing({ baseRef: 'main', root })).resolves.toEqual([]);
  });
});
