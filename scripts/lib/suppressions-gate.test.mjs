import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vite-plus/test';

const GATE = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'verify-suppressions.mjs',
);

const SUPPRESSED_FILE = 'packages/ui/src/probe.util.ts';

const OUTSIDE_FILE = 'apps/harness/src/probe.util.ts';

const ENTRY = {
  count: 1,
  key: `inline ${SUPPRESSED_FILE} NOSONAR`,
  reason: 'A fixture suppression, with a reason long enough to clear the bar.',
  ref: 'issue #510',
};

const REPO_WIDE_BIOME = `${JSON.stringify({
  overrides: [
    {
      includes: ['**/probe.util.ts'],
      linter: { rules: { suspicious: { noShadow: 'off' } } },
    },
  ],
})}\n`;

const REPO_WIDE_ENTRY = {
  count: 1,
  key: 'biome **/probe.util.ts noShadow',
  reason:
    'A fixture repo-wide policy, argued at length enough to clear the bar.',
  ref: 'ADR-035 §7',
};

const temporaryDirectories = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true });
  }
});

const writeIn = (root) => (path, text) => {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), text);
};

const REGISTER = 'docs/agents/public-package-suppressions.json';

const writeRegister = (root, lanes) =>
  writeIn(root)(
    REGISTER,
    JSON.stringify({ acknowledged: [], approved: [], ...lanes }),
  );

const setStatus = (root, status) =>
  writeRegister(root, { approved: [{ ...ENTRY, status }] });

const makeFixtureRepo = ({ biome = '{}\n' } = {}) => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'suppressions-gate-')));
  temporaryDirectories.push(root);
  const write = writeIn(root);
  write('packages/ui/.gitignore', 'eslint-suppressions.json\n');
  write(SUPPRESSED_FILE, 'export const probe = () => 1; // NOSONAR\n');
  write(OUTSIDE_FILE, 'export const outside = () => 1;\n');
  write('biome.jsonc', biome);
  write('doctor.config.jsonc', '{}\n');
  return root;
};

const runGate = (root) =>
  spawnSync(process.execPath, [GATE], { cwd: root, encoding: 'utf8' });

describe('verify-suppressions exit code', () => {
  it('fails on a provisional entry and passes once it is settled', () => {
    const root = makeFixtureRepo();

    setStatus(root, 'provisional');
    const parked = runGate(root);
    expect(parked.status).not.toBe(0);
    expect(parked.stdout).toContain(ENTRY.key);
    expect(parked.stdout).toContain('delete the entry');
    expect(parked.stdout).toContain('permanent');

    setStatus(root, 'permanent');
    const settled = runGate(root);
    expect(settled.status).toBe(0);
    expect(settled.stdout).not.toContain('provisional');
  });

  it('fails on an approved entry that declares no status, and passes once it does', () => {
    const root = makeFixtureRepo();

    writeRegister(root, { approved: [ENTRY] });
    const silent = runGate(root);
    expect(silent.status).not.toBe(0);
    expect(silent.stdout).toContain(ENTRY.key);
    expect(silent.stdout).toContain('status: (absent)');

    setStatus(root, 'permanent');
    const declared = runGate(root);
    expect(declared.status).toBe(0);
  });

  it('fails on an approved entry whose status is not recognised', () => {
    const root = makeFixtureRepo();
    setStatus(root, 'pending');
    const result = runGate(root);
    expect(result.status).not.toBe(0);
    expect(result.stdout).toContain(ENTRY.key);
    expect(result.stdout).toContain('status: pending');
  });

  it('passes an acknowledged entry that carries no status', () => {
    const root = makeFixtureRepo({ biome: REPO_WIDE_BIOME });
    writeRegister(root, {
      acknowledged: [REPO_WIDE_ENTRY],
      approved: [{ ...ENTRY, status: 'permanent' }],
    });
    const result = runGate(root);
    expect(result.stdout).toContain('1 inherited from repo-wide policy');
    expect(result.status).toBe(0);
  });

  it('still fails an unapproved suppression, so the fixture proves something', () => {
    const root = makeFixtureRepo();
    writeRegister(root, {});
    const result = runGate(root);
    expect(result.status).not.toBe(0);
    expect(result.stdout).toContain(ENTRY.key);
  });
});
