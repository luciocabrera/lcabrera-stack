/**
 * What this defends: the EXIT CODE of the real binary, which is all CI reads.
 *
 * A rule that is not wired reports exactly the clean pass a correct record
 * reports, so a passing run is evidence of nothing on its own. Every case here
 * plants one edit in a tree that has just been shown to pass, and puts it back,
 * so the exit code can only be answering that edit (AGENTS.md Rule 14).
 *
 * The baseline's own cases are in `adr-gate-baseline.test.mjs`.
 */
import { afterEach, describe, expect, it } from 'vite-plus/test';

import {
  HOME,
  LEGACY_FILE,
  RECORD,
  RECORD_TEXT,
  editIn,
  makeAdrRepo,
  removeAdrRepos,
  runGate,
  writeIn,
} from './adr-gate-fixtures.mjs';

afterEach(removeAdrRepos);

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

  it('reads a record checked out with CRLF, and still judges it', () => {
    // git-for-windows installs with `core.autocrlf=true`, so this is the default
    // consumer checkout on that platform, not an exotic one. BOTH halves matter:
    // a fix that merely made CRLF stop failing could have done so by reading no
    // block and no section at all, which is what the bug was.
    const root = makeAdrRepo();
    const crlf = (text) => text.replaceAll('\n', '\r\n');
    const write = writeIn(root);

    write(RECORD, crlf(RECORD_TEXT));
    expect(runGate(root).status).toBe(0);

    write(RECORD, crlf(RECORD_TEXT.replace('  - ui', '  - nope')));
    expect(runGate(root).output).toContain('no workspace in this repository');

    write(RECORD, crlf(RECORD_TEXT.replace('## Context', '## Not context')));
    expect(runGate(root).output).toContain('no `## Context` section');
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

describe('--write, which is the command the gate tells people to run', () => {
  it('names the home’s own spelling of it, not this repository’s', () => {
    // The fixture declares no `adrCommands`, so this is the default a consumer
    // gets. A hardcoded `vp run …` here would tell them to run something they do
    // not have — and the earlier spelling crashed outright on a home carrying no
    // commands at all, which is every consumer with no config file.
    const root = makeAdrRepo();
    editIn(root)('docs/decisions/README.md', 'ADR index', 'Stale index');

    const stale = runGate(root);
    expect(stale.status).not.toBe(0);
    expect(stale.output).toContain('npx repo-verify-adrs --write');
    expect(stale.output).not.toContain('vp run');
  });

  it('refuses a record the plain run refuses, rather than exiting clean', () => {
    // `report()`'s staleness finding names `--write`, and it is what
    // `registers.adrCommands.write` puts in every generated index. An author who
    // adds an unclassified record, is told the index is stale, runs the command
    // named, and gets exit 0 has been told the record is fine — by the gate.
    const root = makeAdrRepo();
    editIn(root)(RECORD, '---\ngoverns:\n  - ui\n---\n\n', '');

    expect(runGate(root).status).not.toBe(0);
    expect(runGate(root, ['--write']).status).not.toBe(0);
    expect(runGate(root, ['--write']).output).toContain('no metadata block');
  });

  it('still prunes a baseline entry whose record now passes', () => {
    // The other half, and why this cannot simply refuse on every content
    // finding: "prune me" IS a content finding, so refusing on all of them
    // would leave no command able to shrink the baseline.
    const root = makeAdrRepo({ legacy: true });
    runGate(root, ['--adopt']);
    writeIn(root)(
      `${HOME}/${LEGACY_FILE}`,
      RECORD_TEXT.replace('# ADR-001', '# ADR-002'),
    );

    expect(runGate(root, ['--write']).status).toBe(0);
    expect(runGate(root).status).toBe(0);
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

  it('refuses --package with no name, rather than listing everything', () => {
    // The unknown-name branch below exists so a filter naming nothing cannot
    // read as "no decisions govern it". A MISSING name is the same defect
    // pointed the other way, and louder: the reader gets a table answering a
    // question they did not ask.
    const listed = runGate(makeAdrRepo(), ['--list', '--package']);

    expect(listed.status).not.toBe(0);
    expect(listed.output).toContain('--package needs a workspace');
    expect(listed.stdout).not.toContain('| ADR | Decision |');
  });

  it.each(['--package=nope', '--package='])(
    'refuses `%s`, which argv delivers as one entry',
    (spelling) => {
      // `indexOf('--package')` never matched the `=` form, so the flag read as
      // absent and the full listing printed with a CLEAN exit — the one outcome
      // the space-separated case is refused loudly to prevent.
      const listed = runGate(makeAdrRepo(), ['--list', spelling]);

      expect(listed.status).not.toBe(0);
      expect(listed.stdout).not.toContain('| ADR | Decision |');
    },
  );

  it('accepts the `=` spelling when it names a real workspace', () => {
    const listed = runGate(makeAdrRepo(), ['--list', '--package=ui']);

    expect(listed.status).toBe(0);
    expect(listed.stdout).toContain('## Governing `ui`');
  });

  it('refuses a name no workspace answers to, rather than listing nothing', () => {
    // An empty listing for a typo reads as "no decisions govern it", which is
    // the one answer this command must never give by accident.
    const listed = runGate(makeAdrRepo(), ['--list', '--package', 'nope']);

    expect(listed.status).not.toBe(0);
    expect(listed.output).toContain('is no workspace in this repository');
  });
});
