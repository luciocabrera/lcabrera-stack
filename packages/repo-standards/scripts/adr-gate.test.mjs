/**
 * What this defends: the EXIT CODE of the real binary, which is all CI reads.
 *
 * A rule that is not wired reports exactly the clean pass a correct record
 * reports, and a baseline that swallowed every record would report it too — so
 * a passing run is evidence of nothing on its own. Every case here plants one
 * edit in a tree that has just been shown to pass, and puts it back, so the exit
 * code can only be answering that edit (AGENTS.md Rule 14).
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

import { afterEach, describe, expect, it } from 'vite-plus/test';

const HERE = dirname(fileURLToPath(import.meta.url));
const GATE = resolve(HERE, 'verify-adrs.mjs');

const HOME = 'docs/decisions';
const BASELINE = 'scripts/adr-content-baseline.json';
const RECORD = `${HOME}/ADR-001-a-good-record.md`;
const LEGACY_FILE = 'ADR-002-an-older-record.md';

const RECORD_TEXT = `---
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
const LEGACY_TEXT = `# ADR-002 — An older record

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

const runGate = (root, args = []) => {
  const result = spawnSync(process.execPath, [GATE, ...args], {
    encoding: 'utf8',
    env: { ...process.env, REPO_STANDARDS_HOST_ROOT: root },
  });
  return { ...result, output: `${result.stdout}${result.stderr}` };
};

const writeIn = (root) => (path, text) => {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), text);
};

/** Rewrites one fragment of one file — the single difference between a run that
 *  passes and a run that must not. */
const editIn = (root) => (path, from, to) => {
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
const makeAdrRepo = ({ legacy = false } = {}) => {
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

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { force: true, recursive: true });
  }
});

const readBaseline = (root) =>
  JSON.parse(readFileSync(join(root, BASELINE), 'utf8'));

/** One line appended to the grandfathered list — the whole of the hand edit. */
const appendEntry = (root, filename) => {
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

/** Plant, assert the failure names its own cause, correct, assert the pass. */
const expectPlantedFailure = (root, plant, correct, expected) => {
  plant();
  const planted = runGate(root);
  expect(planted.status).not.toBe(0);
  expect(planted.output).toContain(expected);

  correct();
  expect(runGate(root).status).toBe(0);
};

/** One planted edit and its reversal, for the cases that are a single rewrite. */
const expectRejects = (root, from, to, expected) => {
  const edit = editIn(root);
  expectPlantedFailure(
    root,
    () => edit(RECORD, from, to),
    () => edit(RECORD, to, from),
    expected,
  );
};

describe('the ADR gate reading the record', () => {
  it('passes a complete record and says what it did not check', () => {
    const result = runGate(makeAdrRepo());

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('ADR gate passed: 1 ADR(s)');
    expect(result.stdout).toContain('whether a section says anything true');
  });

  it('rejects a record with no metadata block', () => {
    const root = makeAdrRepo();
    expectRejects(
      root,
      '---\ngoverns:\n  - ui\n---\n\n',
      '',
      'no metadata block',
    );
  });

  it('rejects a key the block does not have', () => {
    const root = makeAdrRepo();
    expectRejects(root, 'governs:', 'packages:', 'is not a key of the block');
  });

  it('rejects a package name no workspace answers to', () => {
    const root = makeAdrRepo();
    expectRejects(
      root,
      '  - ui',
      '  - nope',
      'no workspace in this repository',
    );
  });

  it('rejects an empty scope rather than reading it as repository-wide', () => {
    const root = makeAdrRepo();
    expectRejects(root, 'governs:\n  - ui', 'governs: []', 'is empty');
  });

  it('rejects the repository scope mixed with a workspace', () => {
    const root = makeAdrRepo();
    expectRejects(
      root,
      '  - ui',
      '  - ui\n  - repository',
      'is one or the other',
    );
  });

  it.each(['Context', 'Decision', 'Consequences'])(
    'rejects a record missing %s',
    (heading) => {
      const root = makeAdrRepo();
      expectRejects(
        root,
        `## ${heading}`,
        `## Not ${heading}`,
        `no \`## ${heading}\` section`,
      );
    },
  );

  it('rejects a section heading with nothing under it', () => {
    const root = makeAdrRepo();
    // The comment is what a scaffolded record still has in it, so this is the
    // state the gate has to catch, not a contrived blank.
    expectRejects(
      root,
      'It is so.',
      '<!-- what is now true -->',
      '`## Decision` is empty',
    );
  });

  it('rejects a record carrying neither alternatives section', () => {
    const root = makeAdrRepo();
    expectRejects(
      root,
      '## Alternatives considered',
      '## References',
      'neither `## Options considered` nor `## Alternatives considered`',
    );
  });

  it('accepts `Options considered` in place of `Alternatives considered`', () => {
    const root = makeAdrRepo();
    editIn(root)(RECORD, '## Alternatives considered', '## Options considered');
    expect(runGate(root).status).toBe(0);
  });

  it('still reads the heading number from the body, not from the block', () => {
    // A `#` comment in the block would be the first `# ` line in the file. If
    // the number check read the file rather than the body it would stop firing
    // here and report a clean pass.
    const root = makeAdrRepo();
    const edit = editIn(root);
    edit(RECORD, '---\ngoverns:', '---\n# a note\ngoverns:');
    expectPlantedFailure(
      root,
      () => edit(RECORD, '# ADR-001 —', '# ADR-009 —'),
      () => edit(RECORD, '# ADR-009 —', '# ADR-001 —'),
      'its heading says ADR-009',
    );
  });
});

describe('the grandfathering baseline', () => {
  it('grandfathers a record written before the block, and nothing else', () => {
    const root = makeAdrRepo({ legacy: true });

    expect(runGate(root).status).not.toBe(0);
    expect(runGate(root, ['--adopt']).status).toBe(0);
    expect(runGate(root).status).toBe(0);
    expect(runGate(root).stdout).toContain('1 record(s) predate');

    // The one that is not grandfathered is still held to the rules.
    editIn(root)(RECORD, '## Context', '## Not context');
    expect(runGate(root).output).toContain('no `## Context` section');
  });

  it('refuses a second --adopt over a baseline that is still there', () => {
    // Deliberately narrow, and named for what it asserts: `--adopt` cannot
    // refuse a baseline that has been DELETED, so "no command absorbs new
    // failures" would be a claim this test does not make and the code does not
    // keep. That door is documented open in `adr-baseline.mjs`.
    const root = makeAdrRepo({ legacy: true });
    runGate(root, ['--adopt']);

    const second = runGate(root, ['--adopt']);
    expect(second.status).not.toBe(0);
    expect(second.output).toContain('Adoption happens once');
  });

  it('grandfathers afresh when the baseline is deleted, moving the bound', () => {
    // The open door, pinned so it stays visible: re-adoption is a command path
    // that exempts a new record. It does not defeat the bound — `maxEntries`
    // moves with it — and that pairing is the whole claim the header makes.
    const root = makeAdrRepo({ legacy: true });
    runGate(root, ['--adopt']);
    expect(readBaseline(root).maxEntries).toBe(1);

    writeIn(root)(
      `${HOME}/ADR-003-a-fresh-gap.md`,
      '# ADR-003 — A fresh gap\n',
    );
    rmSync(join(root, BASELINE));
    runGate(root, ['--adopt']);

    expect(runGate(root).status).toBe(0);
    expect(readBaseline(root).maxEntries).toBe(2);
  });

  it('refuses an entry naming no record, and prunes it on --write', () => {
    const root = makeAdrRepo({ legacy: true });
    runGate(root, ['--adopt']);
    rmSync(join(root, HOME, LEGACY_FILE));

    expect(runGate(root).output).toContain('names no ADR');
    runGate(root, ['--write']);
    expect(runGate(root).status).toBe(0);
  });

  it('refuses an entry whose record now satisfies the rules', () => {
    const root = makeAdrRepo({ legacy: true });
    runGate(root, ['--adopt']);
    writeFileSync(
      join(root, HOME, LEGACY_FILE),
      RECORD_TEXT.replace('# ADR-001', '# ADR-002'),
    );

    expect(runGate(root).output).toContain('now satisfies the content rules');
    runGate(root, ['--write']);
    expect(runGate(root).status).toBe(0);
  });

  it('refuses an entry that was never adopted, whatever it is numbered', () => {
    // The door a number window leaves open: this repository's own sequence has
    // gaps, so a record taking a retired number lands INSIDE any window and is
    // grandfathered by one appended line. Growth is decided by how many entries
    // the baseline may hold, which no number can slip past.
    const root = makeAdrRepo({ legacy: true });
    runGate(root, ['--adopt']);
    const write = writeIn(root);
    write(`${HOME}/ADR-001-a-gap-number.md`, '# ADR-001 — A gap number\n');
    appendEntry(root, 'ADR-001-a-gap-number.md');

    expect(runGate(root).output).toContain('has grown');
  });

  it('refuses to prune a grown baseline, rather than absorbing the entry', () => {
    // `--write` prunes. If it also ratcheted the bound UP it would launder the
    // edit above into a baseline the next run reports as clean.
    const root = makeAdrRepo({ legacy: true });
    runGate(root, ['--adopt']);
    const write = writeIn(root);
    write(`${HOME}/ADR-004-another.md`, '# ADR-004 — Another\n');
    appendEntry(root, 'ADR-004-another.md');

    expect(runGate(root, ['--write']).status).not.toBe(0);
    expect(runGate(root).output).toContain('has grown');
  });

  it('does not say "unchanged" about a run that tightened the bound', () => {
    // Reachable by hand-shortening the list without running --write, which
    // leaves slack. The file is rewritten either way, so the message is the only
    // thing that could be wrong — and a gate telling a reader nothing happened
    // is the same defect as a gate claiming more than it checks.
    const root = makeAdrRepo({ legacy: true });
    runGate(root, ['--adopt']);
    const baseline = readBaseline(root);
    writeFileSync(
      join(root, BASELINE),
      `${JSON.stringify({ ...baseline, files: [] }, undefined, 2)}\n`,
    );

    const written = runGate(root, ['--write']);
    expect(written.stdout).toContain('may now hold at most 0');
    expect(written.stdout).not.toContain('unchanged');
  });

  it('lowers the bound as records are classified, so it only ever shrinks', () => {
    const root = makeAdrRepo({ legacy: true });
    runGate(root, ['--adopt']);
    expect(readBaseline(root).maxEntries).toBe(1);

    writeFileSync(
      join(root, HOME, LEGACY_FILE),
      RECORD_TEXT.replace('# ADR-001', '# ADR-002'),
    );
    runGate(root, ['--write']);

    expect(readBaseline(root)).toEqual({ files: [], maxEntries: 0 });
  });
});

describe('listing the decisions that govern one package', () => {
  it('separates a package’s own decisions from the repository-wide ones', () => {
    const root = makeAdrRepo({ legacy: true });
    runGate(root, ['--adopt']);
    writeIn(root)(
      `${HOME}/ADR-003-a-repository-rule.md`,
      RECORD_TEXT.replace('# ADR-001', '# ADR-003').replace(
        '  - ui',
        '  - repository',
      ),
    );

    const listed = runGate(root, ['--list', '--package', 'ui']);
    expect(listed.status).toBe(0);
    expect(listed.stdout).toContain('## Governing `ui`');
    expect(listed.stdout).toContain('[ADR-001]');
    expect(listed.stdout).toContain('Repository-wide');
    expect(listed.stdout).toContain('[ADR-003]');
    expect(listed.stdout).toContain('1 record(s) carry no `governs` block');
  });

  it('refuses a name no workspace answers to, rather than listing nothing', () => {
    // An empty listing for a typo reads as "no decisions govern it", which is
    // the one answer this command must never give by accident.
    const listed = runGate(makeAdrRepo(), ['--list', '--package', 'nope']);

    expect(listed.status).not.toBe(0);
    expect(listed.output).toContain('is no workspace in this repository');
  });
});
