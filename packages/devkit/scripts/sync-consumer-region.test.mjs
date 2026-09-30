/*
 * A created tree whose workspace file has taken a dependency the way the
 * package manager adds one: a default-catalog block appended after the kit's
 * last key. Asserted against a real tree, because the claim is about what
 * `doctor` reports and what `sync` writes over it.
 *
 * Usage: `vp run test` in this workspace; exits non-zero on a failing case.
 */

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vite-plus/test';

import { runCreate } from './command-create.mjs';
import { runDoctor, runSync } from './command-sync.mjs';
import { hashContent, MANIFEST_FILE } from './manifest.mjs';
import { silencedConsole } from './test-fixtures.mjs';

const WORKSPACE_FILE = 'pnpm-workspace.yaml';

const ADDED = '\ncatalog:\n  is-odd: ^3.0.1\n';

const scratches = [];

const quietly = (run) => {
  const silenced = silencedConsole(vi);
  try {
    return run();
  } finally {
    silenced.restore();
  }
};

const created = () => {
  const parent = mkdtempSync(join(tmpdir(), 'devkit-consumer-region-'));
  scratches.push(parent);
  quietly(() => runCreate(['demo'], parent));
  const root = join(parent, 'demo');
  const shipped = readFileSync(join(root, WORKSPACE_FILE), 'utf8');
  return { root, shipped };
};

const write = (root, content) =>
  writeFileSync(join(root, WORKSPACE_FILE), content);

const read = (root) => readFileSync(join(root, WORKSPACE_FILE), 'utf8');

const withTypescriptAt = (content, range) =>
  content.replace(/^( {4}typescript: ).*$/m, (_line, key) => `${key}${range}`);

const recordAsWritten = (root, content) => {
  const path = join(root, MANIFEST_FILE);
  const manifest = JSON.parse(readFileSync(path, 'utf8'));
  writeFileSync(
    path,
    `${JSON.stringify(
      {
        ...manifest,
        files: { ...manifest.files, [WORKSPACE_FILE]: hashContent(content) },
      },
      undefined,
      2,
    )}\n`,
  );
};

const doctor = (root) => quietly(() => runDoctor(['--check'], root));

const acrossSync = (root) => {
  const before = doctor(root);
  const synced = quietly(() => runSync([], root));
  const content = read(root);
  return { after: doctor(root), before, content, synced };
};

afterEach(() => {
  const drained = [...scratches];
  scratches.length = 0;
  for (const root of drained) {
    rmSync(root, { force: true, recursive: true });
  }
});

describe('a dependency added to the default catalog', () => {
  test('leaves doctor --check green', () => {
    const { root, shipped } = created();
    write(root, `${shipped}${ADDED}`);

    expect(doctor(root)).toBe(0);
  });

  test('survives a sync that brings the kit a changed catalog entry', () => {
    const { root, shipped } = created();
    const older = withTypescriptAt(shipped, '^0.0.1');
    write(root, `${older}${ADDED}`);
    recordAsWritten(root, older);

    expect(acrossSync(root)).toEqual({
      after: 0,
      before: 1,
      content: `${shipped}${ADDED}`,
      synced: 0,
    });
  });

  test('does not hide a change to an entry the kit ships', () => {
    const { root, shipped } = created();
    const edited = `${withTypescriptAt(shipped, '^0.0.1')}${ADDED}`;
    write(root, edited);

    expect(acrossSync(root)).toEqual({
      after: 1,
      before: 1,
      content: edited,
      synced: 0,
    });
  });
});
