/*
 * The shipped closure has to report a blueprint import that only `create`
 * would satisfy.
 *
 * `init` and `sync` place the same rung into a repository whose manifest this
 * kit never wrote, so a package declared only by the manifest `create` writes
 * is not provided there. A copy of this package with such an import planted in
 * its blueprint is the probe: the closure must call it an escape.
 */

import { spawnSync } from 'node:child_process';
import {
  cpSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, test } from 'vite-plus/test';

import { DEVKIT_PACKAGE, TOOLCHAIN_RANGES } from './create.mjs';
import { WORKSPACE_DEPENDENCIES } from './workspace.mjs';

const PACKAGE_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

const scratches = [];

afterEach(() => {
  const drained = [...scratches];
  scratches.length = 0;
  for (const root of drained) rmSync(root, { force: true, recursive: true });
});

const copyOfPackage = () => {
  const root = mkdtempSync(join(tmpdir(), 'devkit-closure-plant-'));
  scratches.push(root);
  for (const entry of ['assets', 'scripts', 'package.json']) {
    cpSync(join(PACKAGE_ROOT, entry), join(root, entry), { recursive: true });
  }
  symlinkSync(join(PACKAGE_ROOT, 'node_modules'), join(root, 'node_modules'));
  return root;
};

const shippedClosure = (root) =>
  spawnSync(
    process.execPath,
    [
      join(root, 'scripts', 'devkit.mjs'),
      'closure',
      '--profile',
      'monorepo',
      '--shipped',
    ],
    { cwd: root, encoding: 'utf8' },
  );

describe('a blueprint import only the created manifest declares', () => {
  test('is a package the rung itself does not add', () => {
    expect(Object.keys(TOOLCHAIN_RANGES)).toContain(DEVKIT_PACKAGE);
    expect(Object.keys(WORKSPACE_DEPENDENCIES)).not.toContain(DEVKIT_PACKAGE);
  });

  test('is reported as an escape by the shipped closure', () => {
    const root = copyOfPackage();
    writeFileSync(
      join(root, 'assets', 'workspace', 'scripts', 'planted.mjs'),
      `import { resolveConfig } from '${DEVKIT_PACKAGE}/config';\n\nexport const planted = resolveConfig;\n`,
    );
    const { status, stderr, stdout } = shippedClosure(root);

    expect(status).toBe(1);
    expect(`${stdout}${stderr}`).toContain(
      `scripts/planted.mjs:1  imports ${DEVKIT_PACKAGE}/config`,
    );
  });
});
