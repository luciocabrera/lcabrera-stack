/*
 * `sync` and `doctor` run against an install whose asset set is broken: empty,
 * or missing one group. Neither may retire a recorded file, and both have to
 * say why rather than report a clean run.
 *
 * Usage: `vp run test` in this workspace; exits non-zero on a failing case.
 */

import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
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
    return {
      code,
      errors: silenced.error.mock.calls.flat().join('\n'),
      printed: silenced.log.mock.calls.flat().join('\n'),
    };
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

describe('sync through the command', () => {
  test.skipIf(process.getuid?.() === 0)(
    'keeps an unreadable recorded file the package does not ship (skipped as root, which reads any mode)',
    () => {
      const root = recordedTree();
      chmodSync(join(root, RECORDED), 0o000);

      const { code } = captured(() => runSync([], root));

      expect({ code, survives: existsSync(join(root, RECORDED)) }).toEqual({
        code: 0,
        survives: true,
      });
    },
  );
});

const materialised = (printed) =>
  Number(/: (\d+) file\(s\) materialised/.exec(printed)?.[1]);

describe('init on a tree holding a stale record', () => {
  test('counts only the files it placed as materialised', () => {
    const withRecord = recordedTree();
    mkdirSync(join(withRecord, '.git'));
    const withoutRecord = recordedTree();
    rmSync(join(withoutRecord, MANIFEST_FILE));
    rmSync(join(withoutRecord, RECORDED));
    mkdirSync(join(withoutRecord, '.git'));

    const stale = captured(() => runInit(['--force'], withRecord));
    const clean = captured(() => runInit(['--force'], withoutRecord));

    expect({
      materialised: materialised(stale.printed),
      retired: new RegExp(String.raw`retired\s+${RECORDED}`).test(
        stale.printed,
      ),
    }).toEqual({ materialised: materialised(clean.printed), retired: true });
  });
});
