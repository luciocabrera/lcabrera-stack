import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vite-plus/test';

import {
  editIn,
  makeRegisterRepo,
  PLANNING_DIR,
  REQUIREMENT_DIR,
  removeRegisterRepos,
  writeIn,
} from './doc-register-fixtures.mjs';

// What this defends: the EXIT CODE, which is all CI reads.
//
// Every case below plants a violation in a tree that has just been shown to
// pass, and then puts it back. A rule that is not wired produces exactly the
// clean pass a correct register produces, so the passing run alone is evidence
// of nothing — only the pair is (AGENTS.md Rule 14). The correction is the same
// tree with the one edit reversed, so the exit code can only be answering that
// edit.

const GATE = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'verify-doc-registers.mjs',
);

const REQUIREMENT_FILE = `${REQUIREMENT_DIR}/render-a-table.md`;

afterEach(removeRegisterRepos);

const runGate = (root) => {
  const result = spawnSync(process.execPath, [GATE], {
    cwd: root,
    encoding: 'utf8',
  });
  return { ...result, output: `${result.stdout}${result.stderr}` };
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

describe('verify-doc-registers', () => {
  it('passes the fixture register and says what it did not check', () => {
    const result = runGate(makeRegisterRepo());

    expect(result.status).toBe(0);
    expect(result.stdout).toContain(
      '2 requirement(s), 1 planning document(s) (1 draft(s) carrying no block',
    );
    expect(result.stdout).toContain('1 met and pointing at a command CI runs');
    expect(result.stdout).toContain('whether those commands COULD fail');
  });

  it('fails a malformed entry', () => {
    const root = makeRegisterRepo();
    const edit = editIn(root);

    expectPlantedFailure(
      root,
      () => edit(REQUIREMENT_FILE, 'persona:', 'persoan:'),
      () => edit(REQUIREMENT_FILE, 'persoan:', 'persona:'),
      'unknown field `persoan`',
    );
  });

  it('fails a duplicate id', () => {
    const root = makeRegisterRepo();
    const write = writeIn(root);
    const copy = `${REQUIREMENT_DIR}/render-a-table-too.md`;

    expectPlantedFailure(
      root,
      () =>
        write(
          copy,
          '---\nid: render-a-table\nlines: [application]\npersona: data-user\nstate: unmet\npackages: [ui]\nrequires: []\nissues: []\nevidence:\n  - type: code\n    ref: packages/ui/package.json\n---\n\n# Twice\n\n## Statement\n\nx\n\n## Acceptance\n\n- y\n',
        ),
      () => rmSync(join(root, copy)),
      'duplicate id `render-a-table`',
    );
  });

  it('fails an unresolvable evidence pointer', () => {
    const root = makeRegisterRepo();
    const edit = editIn(root);

    expectPlantedFailure(
      root,
      () =>
        edit(
          REQUIREMENT_FILE,
          'packages/ui/package.json',
          'packages/ui/gone.json',
        ),
      () =>
        edit(
          REQUIREMENT_FILE,
          'packages/ui/gone.json',
          'packages/ui/package.json',
        ),
      'resolves to nothing in this repo',
    );
  });

  // A pointer climbing out of the tree resolves to nothing, rather than to a
  // file on the machine that happens to exist.
  it('fails an evidence pointer that leaves the repository', () => {
    const root = makeRegisterRepo();
    const edit = editIn(root);

    expectPlantedFailure(
      root,
      () =>
        edit(
          REQUIREMENT_FILE,
          'packages/ui/package.json',
          '../../../etc/hosts',
        ),
      () =>
        edit(
          REQUIREMENT_FILE,
          '../../../etc/hosts',
          'packages/ui/package.json',
        ),
      'resolves to nothing in this repo',
    );
  });

  it('fails a dependency cycle', () => {
    const root = makeRegisterRepo();
    const edit = editIn(root);
    const met = `${REQUIREMENT_DIR}/sql-is-safe.md`;

    expectPlantedFailure(
      root,
      () => edit(met, 'requires: []', 'requires:\n  - render-a-table'),
      () => edit(met, 'requires:\n  - render-a-table', 'requires: []'),
      '`requires` cycle:',
    );
  });

  it('fails a package name absent from the derived workspace roster', () => {
    const root = makeRegisterRepo();
    const edit = editIn(root);

    expectPlantedFailure(
      root,
      () => edit(REQUIREMENT_FILE, '  - ui\n', '  - @lcabrera/ui\n'),
      () => edit(REQUIREMENT_FILE, '  - @lcabrera/ui\n', '  - ui\n'),
      'must be a workspace directory name',
    );
  });

  // The roster is derived, not listed: adding the workspace makes the same name
  // legal, which is what proves the check reads `pnpm-workspace.yaml` rather
  // than a copy of it.
  it('accepts a package name once that workspace exists', () => {
    const root = makeRegisterRepo();
    editIn(root)(REQUIREMENT_FILE, '  - ui\n', '  - utils\n');
    expect(runGate(root).status).not.toBe(0);

    writeIn(root)(
      'packages/utils/package.json',
      '{ "name": "@lcabrera/utils" }\n',
    );
    expect(runGate(root).status).toBe(0);
  });

  it('fails a requirement claiming `met` with no evidence pointer CI runs', () => {
    const root = makeRegisterRepo();
    const edit = editIn(root);
    const met = `${REQUIREMENT_DIR}/sql-is-safe.md`;

    expectPlantedFailure(
      root,
      () => edit(met, 'vp run test:ci', 'vp run suppressions:list'),
      () => edit(met, 'vp run suppressions:list', 'vp run test:ci'),
      'carries no `command` evidence pointer that CI runs',
    );
  });

  // `suppressions:list` is a real task in the fixture manifest, so the failure
  // above is answering "CI runs it", not "the task exists". Removing the
  // workflow — the only thing that runs `test:ci` — must fail the same claim.
  it('fails a `met` pointer once nothing in CI runs it', () => {
    const root = makeRegisterRepo();
    expect(runGate(root).status).toBe(0);

    rmSync(join(root, '.github/workflows/check.yml'));
    const result = runGate(root);

    expect(result.status).not.toBe(0);
    expect(result.output).toContain('carries no `command` evidence pointer');
  });

  it('fails a plan carrying no issue reference', () => {
    const root = makeRegisterRepo();
    const edit = editIn(root);
    const plan = `${PLANNING_DIR}/a-plan.md`;

    expectPlantedFailure(
      root,
      () => edit(plan, "issues: ['#547']", 'issues: []'),
      () => edit(plan, 'issues: []', "issues: ['#547']"),
      '`kind: plan` names no issue',
    );
  });

  // The drafts exclusion, which is the difference between a gate people can use
  // and one that fires on the first draft anyone files.
  it('holds a draft carrying no block to nothing, and its charter to the schema', () => {
    const root = makeRegisterRepo();
    const write = writeIn(root);

    write(`${PLANNING_DIR}/adr-drafts/second-draft.md`, '# Another draft\n');
    expect(runGate(root).status).toBe(0);

    // A draft that declares a block anyway is held to it — `adr-drafts/README.md`
    // is itself a charter and carries one, so the exclusion drops the
    // requirement to have a block, not the schema for one.
    write(
      `${PLANNING_DIR}/adr-drafts/README.md`,
      '---\nkind: charter\nstatus: live\nrecorded: not-a-date\nissues: []\npackages: []\n---\n\n# Drafts\n',
    );
    const result = runGate(root);

    expect(result.status).not.toBe(0);
    expect(result.output).toContain('`recorded` must be a YYYY-MM-DD date');
  });

  it('refuses to pass having read no entries', () => {
    const root = makeRegisterRepo();
    expect(runGate(root).status).toBe(0);

    rmSync(join(root, REQUIREMENT_DIR), { force: true, recursive: true });
    const result = runGate(root);

    expect(result.status).not.toBe(0);
    expect(result.output).toContain(
      'read no entries — refusing to report a clean pass on no data',
    );
  });
});
