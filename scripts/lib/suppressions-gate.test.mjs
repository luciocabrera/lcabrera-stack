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
// The same reasoning covers the `status` field itself. Every entry in the
// tracked register declares one, so a run against the real tree cannot tell a
// gate that requires the field from a gate that ignores it — which is how
// deleting the line stayed a silent pass through the change that introduced the
// provisional lane. Each status case below is therefore planted.
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

/**
 * A file outside the public packages, carrying no directive of its own.
 *
 * Its only job is to give a Biome glob something to escape onto, which is what
 * makes the glob classify repo-wide instead of targeted.
 */
const OUTSIDE_FILE = 'apps/harness/src/probe.util.ts';

/** The register entry for the planted suppression, in order but for `status`. */
const ENTRY = {
  count: 1,
  key: `inline ${SUPPRESSED_FILE} NOSONAR`,
  reason: 'A fixture suppression, with a reason long enough to clear the bar.',
  ref: 'issue #510',
};

/** A Biome override reaching both files above, so it resolves as repo-wide. */
const REPO_WIDE_BIOME = `${JSON.stringify({
  overrides: [
    {
      includes: ['**/probe.util.ts'],
      linter: { rules: { suspicious: { noShadow: 'off' } } },
    },
  ],
})}\n`;

/** What that override lands in `acknowledged` — deliberately with no status. */
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

/** Writes both lanes, so an unnamed one is empty rather than absent. */
const writeRegister = (root, lanes) =>
  writeIn(root)(
    REGISTER,
    JSON.stringify({ acknowledged: [], approved: [], ...lanes }),
  );

/** Swaps the planted entry's status, leaving every other input untouched. */
const setStatus = (root, status) =>
  writeRegister(root, { approved: [{ ...ENTRY, status }] });

/**
 * A minimal tree the gate accepts: one public package (marked by the gitignore
 * entry `publicPackageDirs` resolves from), one inline suppression inside it,
 * one file outside it, and the two configs the detector reads.
 *
 * `biome` is the only input a test varies here, because the repo-wide lane
 * exists only when a glob resolves onto both files.
 */
const makeFixtureRepo = ({ biome = '{}\n' } = {}) => {
  // Realpath because a temp dir can sit behind a symlink, and the gate refuses
  // to read a path that does not resolve inside its working directory.
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

  // The third way out of the provisional lane, which the register's own prose
  // said did not exist. An entry with the "status" line deleted is matched,
  // documented and at the agreed count, so every other condition passed it —
  // making silence cheaper than either discharge the doc offers. Fail case
  // first; the pass case is the same tree with the field put back.
  it('fails on an approved entry that declares no status, and passes once it does', () => {
    const root = makeFixtureRepo();

    writeRegister(root, { approved: [ENTRY] });
    const silent = runGate(root);
    expect(silent.status).not.toBe(0);
    expect(silent.stdout).toContain(ENTRY.key);
    expect(silent.stdout).toContain('status: (absent)');

    // Same files, same suppression, same reason and ref — only the field is
    // back, so the exit code can only be answering its absence.
    setStatus(root, 'permanent');
    const declared = runGate(root);
    expect(declared.status).toBe(0);
  });

  // A value outside the vocabulary has to fail as hard as a missing one, or
  // `"pending"` silences an entry exactly like a deleted line while looking
  // like a declaration.
  it('fails on an approved entry whose status is not recognised', () => {
    const root = makeFixtureRepo();
    setStatus(root, 'pending');
    const result = runGate(root);
    expect(result.status).not.toBe(0);
    expect(result.stdout).toContain(ENTRY.key);
    expect(result.stdout).toContain('status: pending');
  });

  // The asymmetry this must not leak into: `acknowledged` records repo-wide
  // policy (ADR-035 §7) that no public package chose, so its entries carry no
  // status at all and a run holding one must still exit 0.
  //
  // Exit 0 is itself the discriminator here — had the Biome glob failed to
  // resolve repo-wide, the acknowledged entry would match nothing and fail as
  // stale, so a pass cannot come from the lane being empty.
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
