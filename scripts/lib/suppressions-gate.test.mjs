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

// What this defends: the EXIT CODE, which is the only thing CI reads.
//
// `provisional` used to be counted into a suffix on the success line, so a
// register holding a parked suppression and one holding none exited 0 alike.
// That is precisely a state no passing run can distinguish — asserting the real
// register still exits 0 would prove nothing about it, so the fail case is
// planted here first and the pass case is the same tree with one field changed.
//
// A synthetic repo rather than the real one: the tree is what the gate reads, so
// mutating the tracked register mid-suite would leave the checkout dirty on any
// failure and race a second runner. Everything the gate reads from the working
// directory is built below.

const GATE = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'verify-suppressions.mjs',
);

const SUPPRESSED_FILE = 'packages/ui/src/probe.util.ts';

/** The register entry for the planted suppression, in order but for `status`. */
const ENTRY = {
  count: 1,
  key: `inline ${SUPPRESSED_FILE} NOSONAR`,
  reason: 'A fixture suppression, with a reason long enough to clear the bar.',
  ref: 'issue #510',
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

/** Swaps the planted entry's status, leaving every other input untouched. */
const setStatus = (root, status) =>
  writeIn(root)(
    REGISTER,
    JSON.stringify({ acknowledged: [], approved: [{ ...ENTRY, status }] }),
  );

/**
 * A minimal tree the gate accepts: one public package (marked by the gitignore
 * entry `publicPackageDirs` resolves from), one inline suppression inside it,
 * and the two configs the detector reads.
 */
const makeFixtureRepo = () => {
  // Realpath because a temp dir can sit behind a symlink, and the gate refuses
  // to read a path that does not resolve inside its working directory.
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'suppressions-gate-')));
  temporaryDirectories.push(root);
  const write = writeIn(root);
  write('packages/ui/.gitignore', 'eslint-suppressions.json\n');
  write(SUPPRESSED_FILE, 'export const probe = () => 1; // NOSONAR\n');
  write('biome.jsonc', '{}\n');
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
    // Named, so the report and the exit code agree on WHICH entry is at fault.
    expect(parked.stdout).toContain(ENTRY.key);
    // Both discharges, because a gate that fails without naming the repair is
    // the one people learn to bypass.
    expect(parked.stdout).toContain('delete the entry');
    expect(parked.stdout).toContain('permanent');

    // The only difference between the two runs. Same files, same suppression,
    // same reason and ref — so the exit code can only be answering the status.
    setStatus(root, 'permanent');
    const settled = runGate(root);
    expect(settled.status).toBe(0);
    expect(settled.stdout).not.toContain('provisional');
  });

  it('still fails an unapproved suppression, so the fixture proves something', () => {
    const root = makeFixtureRepo();
    writeIn(root)(REGISTER, JSON.stringify({ acknowledged: [], approved: [] }));
    const result = runGate(root);
    expect(result.status).not.toBe(0);
    expect(result.stdout).toContain(ENTRY.key);
  });
});
