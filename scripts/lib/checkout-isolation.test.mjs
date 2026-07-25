/**
 * The failure this guards is a feature branch checked out in the SHARED clone,
 * which moves HEAD under every other agent working there. It must fire on that
 * and stay silent on every look-alike — a worktree (the desired state), an
 * anchor branch, and CI, where `actions/checkout` legitimately produces a
 * primary checkout on a feature branch for every single PR run.
 *
 * The dirty-tree case is the one worth reading twice: it must NOT be a hard
 * failure, because this check runs inside `check:push` and would otherwise leave
 * someone with uncommitted work they cannot push and no safe way out.
 */
import { describe, expect, it } from 'vite-plus/test';

import { checkoutIsolationFinding } from './checkout-isolation.mjs';

const facts = (overrides) => ({
  branch: 'feat/123-something',
  isDirty: false,
  isPrimary: true,
  underCI: false,
  ...overrides,
});

describe('checkoutIsolationFinding', () => {
  it('fails a clean primary checkout parked on a feature branch', () => {
    const finding = checkoutIsolationFinding(facts());

    expect(finding?.severity).toBe('problem');
    expect(finding?.message).toContain('feat/123-something');
  });

  it('only warns when the tree is dirty, so it cannot strand uncommitted work', () => {
    const finding = checkoutIsolationFinding(facts({ isDirty: true }));

    expect(finding?.severity).toBe('warning');
  });

  it('says how to get out, in both severities', () => {
    for (const isDirty of [false, true]) {
      expect(checkoutIsolationFinding(facts({ isDirty }))?.message).toContain(
        'worktree',
      );
    }
  });

  it('is silent in a linked worktree — that is the desired state', () => {
    expect(checkoutIsolationFinding(facts({ isPrimary: false }))).toBe(
      undefined,
    );
  });

  it('is silent under CI, where a primary checkout on a branch is normal', () => {
    expect(checkoutIsolationFinding(facts({ underCI: true }))).toBe(undefined);
  });

  it('is silent on the anchor branches', () => {
    for (const branch of ['main', 'release-1.2']) {
      expect(checkoutIsolationFinding(facts({ branch }))).toBe(undefined);
    }
  });

  it('is silent on a detached HEAD, which is nobody’s feature branch', () => {
    expect(checkoutIsolationFinding(facts({ branch: '' }))).toBe(undefined);
  });

  it('does not treat a branch merely starting with "main" as the anchor', () => {
    expect(
      checkoutIsolationFinding(facts({ branch: 'maintenance-work' })),
    ).not.toBe(undefined);
  });
});
