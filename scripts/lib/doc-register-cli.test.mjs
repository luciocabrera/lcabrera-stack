import { spawnSync } from 'node:child_process';
import { readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vite-plus/test';

import {
  makeRegisterRepo,
  REQUIREMENT_DIR,
  removeRegisterRepos,
} from './doc-register-fixtures.mjs';

// Both reports run against a synthetic tree that is not a git repository, has
// no node_modules and no toolchain on PATH. Succeeding there is what "offline"
// means here: nothing is fetched, nothing is resolved through a package
// manager, and the answer comes from the files alone.

const SCRIPTS = resolve(dirname(fileURLToPath(import.meta.url)), '..');

afterEach(removeRegisterRepos);

const run = (script, root, args = []) => {
  const result = spawnSync(process.execPath, [join(SCRIPTS, script), ...args], {
    cwd: root,
    encoding: 'utf8',
  });
  return { ...result, output: `${result.stdout}${result.stderr}` };
};

/** Every file in the tree with its size and mtime — enough to catch a report
 *  that wrote one, whether new or rewritten. */
const treeSnapshot = (root) =>
  readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const path = join(entry.parentPath, entry.name);
      const { mtimeMs, size } = statSync(path);
      return `${path} ${size} ${mtimeMs}`;
    })
    .sort((a, b) => a.localeCompare(b));

describe('product-distance', () => {
  it('reports the register and writes no file', () => {
    const root = makeRegisterRepo();
    const before = treeSnapshot(root);

    const result = run('product-distance.mjs', root);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('2 requirement(s) read');
    expect(result.stdout).toContain('met       1');
    expect(result.stdout).toContain('unmet     1');
    // A tracked distance is a measurement in git, right the day it is written
    // and wrong from the next commit (ADR-049).
    expect(treeSnapshot(root)).toEqual(before);
  });

  it('states that it resolved pointers rather than running them', () => {
    const result = run('product-distance.mjs', makeRegisterRepo());

    expect(result.stdout).toContain('3/3 pointer(s) resolve');
    expect(result.stdout).toContain('Pointers were resolved, not run.');
    expect(result.stdout).toContain('Nothing here executed a test, a build or');
    expect(result.stdout).toContain('This report writes no file.');
  });

  it('refuses to report a distance from no data', () => {
    const root = makeRegisterRepo();
    rmSync(join(root, REQUIREMENT_DIR), { force: true, recursive: true });

    const result = run('product-distance.mjs', root);

    expect(result.status).not.toBe(0);
    expect(result.output).toContain('read no requirements');
  });
});

describe('docs-for-package', () => {
  it('lists both registers for one workspace, and writes no file', () => {
    const root = makeRegisterRepo();
    const before = treeSnapshot(root);

    const result = run('docs-for-package.mjs', root, ['ui']);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Documents concerning `ui` — 2');
    expect(result.stdout).toContain(`${REQUIREMENT_DIR}/render-a-table.md`);
    expect(result.stdout).toContain('docs/agents/planning/a-plan.md');
    expect(treeSnapshot(root)).toEqual(before);
  });

  // The discriminator: `server` and `ui` are both real workspaces here, and the
  // fixture's requirements name one each — so a listing that ignored the
  // argument would return the same rows for both.
  it('lists only what the named workspace declares', () => {
    const root = makeRegisterRepo();

    const server = run('docs-for-package.mjs', root, ['server']);

    expect(server.stdout).toContain(`${REQUIREMENT_DIR}/sql-is-safe.md`);
    expect(server.stdout).not.toContain('render-a-table');
  });

  it('refuses a name no workspace answers to, and names the roster', () => {
    const root = makeRegisterRepo();

    const npmName = run('docs-for-package.mjs', root, ['@lcabrera/ui']);

    expect(npmName.status).not.toBe(0);
    expect(npmName.output).toContain('is not a workspace directory');
    expect(npmName.output).toContain('server, ui');
  });

  it('refuses to guess when no workspace is named', () => {
    const result = run('docs-for-package.mjs', makeRegisterRepo());

    expect(result.status).not.toBe(0);
    expect(result.output).toContain('name a workspace directory');
  });
});
