/**
 * The failure this guards is a merged task file left `active` on `main` (the
 * #352 residue). It must fire on that case and stay silent on every look-alike:
 * an open PR whose branch is still live, a genuinely-absent ref (already warned
 * elsewhere), and — critically — a run that could not read the remote at all.
 */
import { describe, expect, it } from 'vite-plus/test';

import { mergedTaskDriftWarnings } from './coordination-reconcile.mjs';

const NO_BRANCH = new Set(['(uncommitted)', '(none)', '(worktree)']);
const NO_PR = new Set(['(none)', '']);

const task = (overrides) => ({
  data: {
    branch: 'feat/x',
    id: 't',
    pr: 42,
    status: 'active',
    ...overrides,
  },
  name: 't.md',
});

const run = ({ liveBranches, refExists = () => true, tasks }) =>
  mergedTaskDriftWarnings({
    liveBranches,
    noBranch: NO_BRANCH,
    noPr: NO_PR,
    refExists,
    tasks,
  });

describe('mergedTaskDriftWarnings', () => {
  it('warns when a task records a real PR but its branch is gone from live origin', () => {
    const warnings = run({ liveBranches: ['other'], tasks: [task()] });
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('gone from origin');
  });

  it('stays silent when the remote could not be read (liveBranches undefined)', () => {
    expect(run({ liveBranches: undefined, tasks: [task()] })).toEqual([]);
  });

  it('does not warn when the branch is still live (open PR)', () => {
    expect(run({ liveBranches: ['feat/x'], tasks: [task()] })).toEqual([]);
  });

  it('defers to checkTaskBranches when the ref is genuinely absent', () => {
    expect(
      run({ liveBranches: ['other'], refExists: () => false, tasks: [task()] }),
    ).toEqual([]);
  });

  it('skips done tasks', () => {
    expect(
      run({ liveBranches: ['other'], tasks: [task({ status: 'done' })] }),
    ).toEqual([]);
  });

  it('skips tasks without a real PR or a real branch', () => {
    expect(
      run({ liveBranches: ['other'], tasks: [task({ pr: '(none)' })] }),
    ).toEqual([]);
    expect(
      run({ liveBranches: ['other'], tasks: [task({ pr: undefined })] }),
    ).toEqual([]);
    expect(
      run({ liveBranches: ['other'], tasks: [task({ branch: '(worktree)' })] }),
    ).toEqual([]);
  });

  it('normalizes a "#"-prefixed / padded PR value before checking it is real', () => {
    const warnings = run({
      liveBranches: ['other'],
      tasks: [task({ pr: ' 42 ' })],
    });
    expect(warnings).toHaveLength(1);
  });
});
