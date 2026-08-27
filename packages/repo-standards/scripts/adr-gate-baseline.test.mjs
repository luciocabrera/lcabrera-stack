/**
 * The grandfathering baseline, through the real binary.
 *
 * Split from `adr-gate.test.mjs` when that file reached the script-size ceiling;
 * the fixtures both use are `adr-gate-fixtures.mjs`. Same method: plant one edit
 * in a tree that has just been shown to pass, and read the exit code.
 *
 * The last case pins a residual rather than a refusal — see its comment.
 */
import { rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vite-plus/test';

import {
  BASELINE,
  HOME,
  LEGACY_FILE,
  RECORD,
  RECORD_TEXT,
  appendEntry,
  editIn,
  makeAdrRepo,
  readBaseline,
  removeAdrRepos,
  runGate,
  writeIn,
} from './adr-gate-fixtures.mjs';

afterEach(removeAdrRepos);

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
    // Named for what it asserts and no more: `--adopt` cannot refuse a baseline
    // that has been DELETED, so a name like "no command absorbs new failures"
    // would claim something neither this test nor the code keeps.
    const root = makeAdrRepo({ legacy: true });
    runGate(root, ['--adopt']);

    const second = runGate(root, ['--adopt']);
    expect(second.status).not.toBe(0);
    expect(second.output).toContain('Adoption happens once');
  });

  it('grandfathers afresh when the baseline is deleted, moving the bound', () => {
    // Pinned as behaviour, not as a refusal: re-adoption after deletion exempts
    // whatever fails at that moment. It leaves the bound intact, which is all
    // the gate promises — the change to the exempt set is in the file's diff.
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

  it('refuses a list longer than its bound, whatever the entry is numbered', () => {
    // What a number window leaves open: this repository's own sequence has gaps,
    // so a record taking a retired number lands INSIDE any window and is
    // grandfathered by one appended line. The bound is a count, which no
    // numbering can slip past.
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

  it('lets a count-preserving swap through, which is why the diff is the review', () => {
    // The residual, pinned as behaviour rather than argued away. Classifying a
    // record frees its line; spending that line on a content-less new record
    // keeps the count at its bound and reports nothing. Each new exemption still
    // costs an old one, so the list cannot grow — but `maxEntries` does not move,
    // and only the file's diff shows the trade. Whether the gate should refuse a
    // swap outright is a separate design question (#1014).
    const root = makeAdrRepo({ legacy: true });
    runGate(root, ['--adopt']);
    const write = writeIn(root);
    write(
      `${HOME}/${LEGACY_FILE}`,
      RECORD_TEXT.replace('# ADR-001', '# ADR-002'),
    );
    write(`${HOME}/ADR-003-a-swap-probe.md`, '# ADR-003 — A swap probe\n');
    const baseline = readBaseline(root);
    writeFileSync(
      join(root, BASELINE),
      `${JSON.stringify(
        { ...baseline, files: ['ADR-003-a-swap-probe.md'] },
        undefined,
        2,
      )}\n`,
    );

    expect(runGate(root).status).toBe(0);
    expect(readBaseline(root).maxEntries).toBe(1);
  });

  it('lowers the bound as records are classified', () => {
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
