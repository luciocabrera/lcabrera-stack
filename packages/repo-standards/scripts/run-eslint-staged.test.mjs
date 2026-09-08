/**
 * Runs the real ESLint through `run-eslint-staged.mjs`, once.
 *
 * The unit tests assert the argument list against this module's own
 * expectations, so they pass whether or not ESLint accepts it. Two assumptions
 * are load-bearing on every commit and neither is visible from the list: that
 * ESLint reads a bare `--` as end-of-options, and that the run stays scoped the
 * way `eslint .` would be. If the first is wrong, ESLint reports no files
 * matching `--` and every commit is blocked; if the second is, a clean pass and
 * a pass that linted nothing are the same output.
 */
import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vite-plus/test';

import { resolveHostRoot } from './host-root.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolveHostRoot({ moduleDirectory: HERE });
const RUNNER = join(HERE, 'run-eslint-staged.mjs');

const roots = [];

const makeWorkspace = () => {
  mkdirSync(join(REPO_ROOT, '.tmp'), { recursive: true });
  const root = mkdtempSync(join(REPO_ROOT, '.tmp', 'eslint-staged-'));
  roots.push(root);
  writeFileSync(
    join(root, 'eslint.config.mjs'),
    "export default [{ rules: { 'no-unused-vars': 'error' } }];\n",
  );
  mkdirSync(join(root, 'node_modules', '.bin'), { recursive: true });
  symlinkSync(
    join(HERE, '..', 'node_modules', '.bin', 'eslint'),
    join(root, 'node_modules', '.bin', 'eslint'),
  );
  return root;
};

const lint = (root, name) =>
  spawnSync(process.execPath, [RUNNER, '--check', '--', join(root, name)], {
    encoding: 'utf8',
  });

afterAll(() => {
  for (const root of roots) rmSync(root, { force: true, recursive: true });
});

describe('run-eslint-staged against the real ESLint', () => {
  it('reports a violation the config asks for', () => {
    const root = makeWorkspace();
    writeFileSync(
      join(root, 'bad.js'),
      'export const bad = () => {\n  const unused = 1;\n  return 2;\n};\n',
    );
    const { status, stdout } = lint(root, 'bad.js');
    expect(stdout).toContain('no-unused-vars');
    expect(status).toBe(1);
  });

  it('passes a file the same config is happy with', () => {
    const root = makeWorkspace();
    writeFileSync(join(root, 'good.js'), 'export const good = () => 2;\n');
    expect(lint(root, 'good.js').status).toBe(0);
  });

  it('never reports no files matching "--"', () => {
    const root = makeWorkspace();
    writeFileSync(join(root, 'good.js'), 'export const good = () => 2;\n');
    const { stderr, stdout } = lint(root, 'good.js');
    expect(`${stdout}${stderr}`).not.toContain('No files matching');
  });
});
