import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

const GIT_SYMLINK_MODE = '120000';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const MIRRORS = [
  { path: 'CLAUDE.md', target: 'AGENTS.md' },
  { path: 'GEMINI.md', target: 'AGENTS.md' },
  { path: '.github/copilot-instructions.md', target: '../AGENTS.md' },
];

const REDIRECTING_VARS = [
  'GIT_ALTERNATE_OBJECT_DIRECTORIES',
  'GIT_COMMON_DIR',
  'GIT_DIR',
  'GIT_INDEX_FILE',
  'GIT_NAMESPACE',
  'GIT_OBJECT_DIRECTORY',
  'GIT_WORK_TREE',
];

const gitEnv = () =>
  Object.fromEntries(
    Object.entries(process.env).filter(
      ([name]) => !REDIRECTING_VARS.includes(name),
    ),
  );

const indexEntryFor = (path) => {
  const output = execFileSync('git', ['ls-files', '--stage', '--', path], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env: gitEnv(),
  });
  const [mode, , , ...rest] = output.trim().split(/\s+/);
  return { mode, name: rest.join(' ') };
};

const blobFor = (path) =>
  execFileSync('git', ['cat-file', '-p', `:${path}`], {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    env: gitEnv(),
  });

describe('agent instruction mirrors', () => {
  it.each(MIRRORS)('$path is committed as a symlink', ({ path }) => {
    expect(indexEntryFor(path).mode).toBe(GIT_SYMLINK_MODE);
  });

  it.each(MIRRORS)('$path points at $target', ({ path, target }) => {
    expect(blobFor(path).trim()).toBe(target);
  });

  it('every mirror resolves to the same content as AGENTS.md', () => {
    const source = readFileSync(join(REPO_ROOT, 'AGENTS.md'), 'utf8');
    for (const { path } of MIRRORS) {
      expect(readFileSync(join(REPO_ROOT, path), 'utf8')).toBe(source);
    }
  });
});
