import { describe, expect, it } from 'vitest';

import { branchErrors, taskErrors } from './coordination-schema.mjs';

// The coordination register is the only signal of who owns what while several
// agents and humans work this repo in parallel (Rule 12), and CI fails on
// register INTEGRITY — so these validators decide whether a claim is a claim.
// The `issue` rule in particular is what stops a task drifting away from its
// backlog item (ADR-036): `(none)` must fail, not warn.

const validTask = {
  area: ['packages/ui/**'],
  branch: 'feat/thing',
  id: 'my-task',
  issue: '#123',
  owner: 'agent:claude',
  started: '2026-07-21',
  status: 'active',
  title: 'Do the thing',
  updated: '2026-07-21',
};

const taskFile = (overrides = {}) => ({
  data: { ...validTask, ...overrides },
  slug: 'my-task',
});

describe('taskErrors', () => {
  it('accepts a complete, well-formed task', () => {
    expect(taskErrors(taskFile(), new Map())).toEqual([]);
  });

  it('reports every missing required field, not just the first', () => {
    // A verify script must list all discrepancies in one run.
    const errors = taskErrors(
      { data: { id: 'my-task' }, slug: 'my-task' },
      new Map(),
    );
    expect(errors.length).toBeGreaterThan(5);
  });

  it('treats an empty area list as missing', () => {
    // The area globs ARE the soft lock; an empty list claims nothing.
    expect(taskErrors(taskFile({ area: [] }), new Map()).join(' ')).toContain(
      'area',
    );
  });

  it('rejects a status outside the allowed set', () => {
    expect(
      taskErrors(taskFile({ status: 'in-progress' }), new Map()),
    ).not.toEqual([]);
    for (const status of ['active', 'blocked', 'review', 'paused', 'done']) {
      expect(taskErrors(taskFile({ status }), new Map())).toEqual([]);
    }
  });

  it('requires an owner of the form agent:<name> or human:<name>', () => {
    expect(taskErrors(taskFile({ owner: 'claude' }), new Map())).not.toEqual(
      [],
    );
    expect(taskErrors(taskFile({ owner: 'human:lucio' }), new Map())).toEqual(
      [],
    );
  });

  it('requires a real issue reference — `(none)` must fail', () => {
    expect(taskErrors(taskFile({ issue: '(none)' }), new Map())).not.toEqual(
      [],
    );
    expect(taskErrors(taskFile({ issue: 'TBD' }), new Map())).not.toEqual([]);

    for (const issue of [
      '#123',
      '123',
      'https://github.com/owner/repo/issues/123',
    ]) {
      expect(taskErrors(taskFile({ issue }), new Map())).toEqual([]);
    }
  });

  it('rejects a date that is not ISO', () => {
    expect(
      taskErrors(taskFile({ updated: '21-07-2026' }), new Map()),
    ).not.toEqual([]);
    expect(
      taskErrors(taskFile({ started: 'yesterday' }), new Map()),
    ).not.toEqual([]);
  });

  it('requires the id to match the filename slug', () => {
    expect(
      taskErrors({ data: validTask, slug: 'different-name' }, new Map()),
    ).not.toEqual([]);
  });

  it('reports a duplicate id against already-seen tasks', () => {
    const seen = new Map([['my-task', 'other-file.md']]);
    expect(taskErrors(taskFile(), seen).join(' ')).toContain('duplicate');
  });
});

describe('branchErrors', () => {
  const validBranch = {
    base: 'main',
    branch: 'feat/shared-thing',
    integrator: 'agent:claude',
    status: 'active',
    target: 'main',
    updated: '2026-07-21',
  };

  it('accepts a well-formed shared-branch descriptor', () => {
    // The slug is the WHOLE branch name flattened — `feat/shared-thing`
    // becomes `feat-shared-thing`, not just its last segment.
    expect(
      branchErrors({ data: validBranch, slug: 'feat-shared-thing' }),
    ).toEqual([]);
  });

  it('requires the filename to be the branch slug', () => {
    expect(
      branchErrors({ data: validBranch, slug: 'something-else' }).join(' '),
    ).toContain('branch slug');
  });

  it('rejects a status outside the branch set', () => {
    // Branch descriptors have their own narrower set — `paused` is a task
    // status, not a branch one.
    expect(
      branchErrors({
        data: { ...validBranch, status: 'paused' },
        slug: 'feat-shared-thing',
      }),
    ).not.toEqual([]);
  });

  it('reports every missing required field', () => {
    expect(
      branchErrors({ data: { branch: 'feat/x' }, slug: 'x' }).length,
    ).toBeGreaterThan(3);
  });
});
