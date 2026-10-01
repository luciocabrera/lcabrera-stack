/*
 * `sync` and `doctor` run against an install whose asset set is broken: empty,
 * or missing one group. Neither may retire a recorded file, and both have to
 * say why rather than report a clean run.
 *
 * Usage: `vp run test` in this workspace; exits non-zero on a failing case.
 */

import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vite-plus/test';

import { runInit } from './command-init.mjs';
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

const afterRun = ({ names, root, run }) => {
  const { code, errors } = captured(() => run(root));
  return {
    code,
    explained: errors.includes(names),
    recorded: Object.hasOwn(
      JSON.parse(readFileSync(join(root, MANIFEST_FILE), 'utf8')).files,
      RECORDED,
    ),
    survives: existsSync(join(root, RECORDED)),
  };
};

const REFUSED = { code: 1, explained: true, recorded: true, survives: true };

const COMMANDS = {
  'doctor --check': (root) => runDoctor(['--check'], root),
  init: (root) => {
    mkdirSync(join(root, '.git'));
    return runInit(['--force'], root);
  },
  sync: (root) => runSync([], root),
};

describe('an install whose asset set is broken', () => {
  for (const [label, { keeps, names }] of Object.entries(BROKEN)) {
    for (const [command, run] of Object.entries(COMMANDS)) {
      test(`makes ${command} fail, say why and retire nothing when ${label}`, () => {
        shipped.keeps = keeps;

        expect(afterRun({ names, root: recordedTree(), run })).toEqual(REFUSED);
      });
    }
  }
});
