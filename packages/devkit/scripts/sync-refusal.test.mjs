/*
 * `sync` and `doctor` run against an install whose asset set is broken: empty,
 * or missing one group. Neither may retire a recorded file, and both have to
 * say why rather than report a clean run.
 *
 * Usage: `vp run test` in this workspace; exits non-zero on a failing case.
 */

import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vite-plus/test';

import { runDoctor, runSync } from './command-sync.mjs';
import { hashContent, MANIFEST_FILE } from './manifest.mjs';
import { silencedConsole } from './test-fixtures.mjs';

const shipped = vi.hoisted(() => ({ keeps: () => true }));

vi.mock('./files.mjs', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    readFilesUnder: (args) =>
      original.readFilesUnder(args).filter((asset) => shipped.keeps(asset)),
  };
});

const RECORDED = 'recorded.md';

const scratches = [];

afterEach(() => {
  shipped.keeps = () => true;
  const drained = [...scratches];
  scratches.length = 0;
  for (const root of drained) rmSync(root, { force: true, recursive: true });
});

const recordedTree = () => {
  const root = mkdtempSync(join(tmpdir(), 'devkit-refusal-'));
  scratches.push(root);
  writeFileSync(join(root, RECORDED), 'recorded body');
  writeFileSync(
    join(root, MANIFEST_FILE),
    JSON.stringify({
      files: { [RECORDED]: hashContent('recorded body') },
      packageVersion: '0.0.0',
      version: 1,
    }),
  );
  return root;
};

const captured = (run) => {
  const silenced = silencedConsole(vi);
  try {
    const code = run();
    return { code, errors: silenced.error.mock.calls.flat().join('\n') };
  } finally {
    silenced.restore();
  }
};

const BROKEN = {
  empty: { keeps: () => false, names: 'holds no assets' },
  'missing a group': {
    keeps: (asset) => !asset.path.startsWith('hooks/'),
    names: 'no assets in hooks',
  },
};

describe('an install whose asset set is broken', () => {
  for (const [label, { keeps, names }] of Object.entries(BROKEN)) {
    test(`makes sync fail, say why and retire nothing when ${label}`, () => {
      shipped.keeps = keeps;
      const root = recordedTree();

      const { code, errors } = captured(() => runSync([], root));

      expect(code).toBe(1);
      expect(errors).toContain(names);
      expect(existsSync(join(root, RECORDED))).toBe(true);
      expect(
        JSON.parse(readFileSync(join(root, MANIFEST_FILE), 'utf8')).files,
      ).toHaveProperty([RECORDED]);
    });

    test(`makes doctor --check fail and say why when ${label}`, () => {
      shipped.keeps = keeps;
      const root = recordedTree();

      const { code, errors } = captured(() => runDoctor(['--check'], root));

      expect(code).toBe(1);
      expect(errors).toContain(names);
    });
  }
});
