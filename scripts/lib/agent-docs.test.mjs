import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

// AGENTS.md is the single source of the repo's instructions; CLAUDE.md,
// GEMINI.md and .github/copilot-instructions.md are symlinks to it so every
// agent reads the same file and drift is impossible by construction.
//
// They were symlinks until #240, where a mechanical `@repo/` → `@lcabrera/`
// rewrite followed each link and wrote a regular file back — the behaviour of an
// in-place text edit on a symlink. Nothing in that PR mentions it, so it was
// never a decision. Three commits of AGENTS.md later (#257, #259, #266) the
// copies were 92 lines stale, and #257 was the correction telling agents NOT to
// put language settings in .sonarcloud.properties — advice the stale copies
// still gave.
//
// This asserts the git mode (120000), not the working tree, so it holds on a
// checkout where symlinks are materialised as plain files and still fails the
// moment one is committed as content.
const GIT_SYMLINK_MODE = '120000';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const MIRRORS = [
  { path: 'CLAUDE.md', target: 'AGENTS.md' },
  { path: 'GEMINI.md', target: 'AGENTS.md' },
  { path: '.github/copilot-instructions.md', target: '../AGENTS.md' },
];

// Scrubbed so an inherited GIT_DIR cannot point this at another repository —
// the variable outranks `cwd`, which is what corrupted the index in #270.
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
