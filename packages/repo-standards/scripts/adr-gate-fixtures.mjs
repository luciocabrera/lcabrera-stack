/**
 * The synthetic repository the ADR gate's end-to-end tests run against, and the
 * helpers that plant one edit in it.
 *
 * A synthetic tree rather than this one: the gate reads a whole repository, so
 * planting a violation in the tracked ADR home would leave the checkout dirty on
 * any failure and race a second runner. Everything the gate reads is built here
 * — the workspace roster, the config, the home and its index — which is also
 * what makes each planted edit the ONLY difference between a failing run and a
 * passing one.
 *
 * Shared by `adr-gate.test.mjs` and `adr-gate-baseline.test.mjs`, which are two
 * files because one was over the script-size ceiling. Excluded from the package
 * by the `files` entry beside the test exclusion — it is test scaffolding and a
 * consumer has no use for it.
 */
import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const GATE = resolve(HERE, 'verify-adrs.mjs');

export const HOME = 'docs/decisions';
export const BASELINE = 'scripts/adr-content-baseline.json';
export const RECORD = `${HOME}/ADR-001-a-good-record.md`;
export const LEGACY_FILE = 'ADR-002-an-older-record.md';

export const RECORD_TEXT = `---
governs:
  - ui
---

# ADR-001 — Keep the good thing

**Status:** Accepted

## Context

It was so.

## Decision

It is so.

## Consequences

It costs this.

## Alternatives considered

The other thing, and why it lost.
`;

/** Written before the block existed: no block, and no alternatives section. */
export const LEGACY_TEXT = `# ADR-002 — An older record

## Context

Written before the block existed.

## Decision

It stands.

## Consequences

Nothing changes.
`;

const CONFIG = `{
  "registers": {
    "adrContentBaseline": "${BASELINE}",
    "adrGrandfatheredDuplicates": [],
    "adrHomes": [
      { "blurb": "Decisions.", "dir": "${HOME}", "tier": "repo", "title": "Decisions" }
    ]
  }
}
`;

const roots = [];

export const runGate = (root, args = []) => {
  const result = spawnSync(process.execPath, [GATE, ...args], {
    encoding: 'utf8',
    env: { ...process.env, REPO_STANDARDS_HOST_ROOT: root },
  });
  return { ...result, output: `${result.stdout}${result.stderr}` };
};

export const writeIn = (root) => (path, text) => {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), text);
};

/** Rewrites one fragment of one file — the single difference between a run that
 *  passes and a run that must not. */
export const editIn = (root) => (path, from, to) => {
  const full = join(root, path);
  const before = readFileSync(full, 'utf8');
  const after = before.replace(from, to);
  if (after === before) {
    throw new Error(`fixture: \`${from}\` is not in ${path}`);
  }
  writeFileSync(full, after);
};

/**
 * A repository the gate can read: a workspace roster, one home, one complete
 * record, and the generated index — produced by the gate itself, so the fixture
 * cannot disagree with what the gate would write.
 */
export const makeAdrRepo = ({ legacy = false } = {}) => {
  // Realpath because a temp dir can sit behind a symlink, and the config reader
  // refuses a path that does not resolve inside the root it was given.
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'adr-gate-')));
  roots.push(root);
  const write = writeIn(root);
  write('pnpm-workspace.yaml', "packages:\n  - 'packages/*'\n");
  write('packages/ui/package.json', '{ "name": "@scope/ui" }\n');
  write('packages/server/package.json', '{ "name": "@scope/server" }\n');
  write('devkit.config.json', CONFIG);
  write(RECORD, RECORD_TEXT);
  if (legacy) {
    write(`${HOME}/${LEGACY_FILE}`, LEGACY_TEXT);
  }
  runGate(root, ['--write']);
  return root;
};

export const readBaseline = (root) =>
  JSON.parse(readFileSync(join(root, BASELINE), 'utf8'));

/** One line appended to the grandfathered list — the whole of the hand edit. */
export const appendEntry = (root, filename) => {
  const baseline = readBaseline(root);
  writeFileSync(
    join(root, BASELINE),
    `${JSON.stringify(
      {
        ...baseline,
        files: [...baseline.files, filename].toSorted((left, right) =>
          left.localeCompare(right),
        ),
      },
      undefined,
      2,
    )}\n`,
  );
};

/** Removes every tree this module made. Call from an `afterEach`. */
export const removeAdrRepos = () => {
  for (const root of roots.splice(0)) {
    rmSync(root, { force: true, recursive: true });
  }
};
