/*
 * A raised floor reaches nobody until `devkit` publishes, so a release whose
 * changesets move only another package must still version devkit when a
 * shipped floor moved — and must leave it alone when none did (#1226). Runs the
 * real `release-version.mjs` and `changeset version` in a scratch workspace.
 */
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vite-plus/test';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const SCRIPT = join(REPO_ROOT, 'scripts', 'release-version.mjs');

const WEB_MANIFEST = 'packages/devkit/assets/workspace/apps/web/package.json';

const scratches = [];

const write = (root, path, content) => {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(
    join(root, path),
    typeof content === 'string'
      ? content
      : `${JSON.stringify(content, undefined, 2)}\n`,
  );
};

const manifest = (name, version, extra = {}) => ({ name, version, ...extra });

const workspaceWith = (changeset) => {
  const root = mkdtempSync(join(tmpdir(), 'release-version-'));
  scratches.push(root);
  symlinkSync(join(REPO_ROOT, 'node_modules'), join(root, 'node_modules'));

  write(root, 'package.json', { name: 'scratch', private: true });
  write(root, 'pnpm-workspace.yaml', 'packages:\n  - packages/*\n');
  write(root, '.changeset/config.json', {
    access: 'public',
    baseBranch: 'main',
    changelog: '@changesets/cli/changelog',
    commit: false,
    updateInternalDependencies: 'patch',
  });
  write(root, '.changeset/pending.md', changeset);
  write(
    root,
    'packages/devkit/package.json',
    manifest('@lcabrera/devkit', '0.6.0'),
  );
  write(
    root,
    'packages/devkit/scripts/create.mjs',
    'export const TOOLCHAIN_RANGES = {};\n',
  );
  write(root, WEB_MANIFEST, {
    dependencies: { '@lcabrera/ui': '>=0.8.1 <1.0.0' },
    name: 'web',
  });
  write(root, 'packages/ui/package.json', manifest('@lcabrera/ui', '0.8.1'));
  write(
    root,
    'packages/server/package.json',
    manifest('@lcabrera/server', '0.7.1'),
  );
  return root;
};

const release = (root) =>
  spawnSync(process.execPath, [SCRIPT], { cwd: root, encoding: 'utf8' });

const readJson = (root, path) =>
  JSON.parse(readFileSync(join(root, path), 'utf8'));

const changelogOf = (root) => {
  const path = join(root, 'packages', 'devkit', 'CHANGELOG.md');
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
};

afterEach(() => {
  for (const root of scratches.splice(0)) {
    rmSync(root, { force: true, recursive: true });
  }
});

describe('release-version', () => {
  it('versions devkit by a patch, naming the floor, when only another package moved one', () => {
    const root = workspaceWith(
      "---\n'@lcabrera/ui': minor\n---\n\nA change.\n",
    );
    const run = release(root);

    expect(run.status, run.stderr).toBe(0);
    expect(readJson(root, 'packages/ui/package.json').version).toBe('0.9.0');
    expect(readJson(root, WEB_MANIFEST).dependencies['@lcabrera/ui']).toBe(
      '>=0.9.0 <1.0.0',
    );
    expect(readJson(root, 'packages/devkit/package.json').version).toBe(
      '0.6.1',
    );
    expect(changelogOf(root)).toContain(
      '`@lcabrera/ui` `>=0.9.0 <1.0.0` (was `>=0.8.1 <1.0.0`)',
    );
  });

  it('leaves devkit alone when no shipped floor moved', () => {
    const root = workspaceWith(
      "---\n'@lcabrera/server': minor\n---\n\nA change.\n",
    );
    const run = release(root);

    expect(run.status, run.stderr).toBe(0);
    expect(readJson(root, 'packages/server/package.json').version).toBe(
      '0.8.0',
    );
    expect(readJson(root, 'packages/devkit/package.json').version).toBe(
      '0.6.0',
    );
    expect(changelogOf(root)).toBe('');
  });

  it('adds no second bump when the changesets already version devkit', () => {
    const root = workspaceWith(
      "---\n'@lcabrera/ui': minor\n'@lcabrera/devkit': minor\n---\n\nA change.\n",
    );
    const run = release(root);

    expect(run.status, run.stderr).toBe(0);
    expect(readJson(root, 'packages/devkit/package.json').version).toBe(
      '0.7.0',
    );
    expect(readJson(root, WEB_MANIFEST).dependencies['@lcabrera/ui']).toBe(
      '>=0.9.0 <1.0.0',
    );
  });
});
