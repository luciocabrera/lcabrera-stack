import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { runGit } from './git-exec.mjs';

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

import {
  checkoutIsolationFinding,
  readCheckoutFacts,
} from './checkout-isolation.mjs';

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

  it('treats the configured trunk as an anchor, not only `main`', () => {
    // Hardcoded as `main`, this reported every consumer whose git produced
    // `master` as parked on a feature branch — on their own trunk, with a clean
    // tree, as a `problem`, advising `git checkout main` to a branch that does
    // not exist.
    expect(
      checkoutIsolationFinding({
        ...facts({ branch: 'master' }),
        defaultBranch: 'master',
      }),
    ).toBeUndefined();
  });

  it('names the configured trunk in its remedy', () => {
    const finding = checkoutIsolationFinding({
      ...facts(),
      defaultBranch: 'trunk',
    });

    expect(finding?.message).toContain('git checkout trunk');
    expect(finding?.message).not.toContain('git checkout main');
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

describe('readCheckoutFacts', () => {
  /** A real repository, because these facts come from git rather than from a shape. */
  const repository = () => {
    const repositoryRoot = mkdtempSync(join(tmpdir(), 'checkout-facts-'));
    runGit({
      args: ['init', '--initial-branch=main', '.'],
      cwd: repositoryRoot,
    });
    runGit({
      args: ['config', 'user.email', 'test@example.com'],
      cwd: repositoryRoot,
    });
    runGit({ args: ['config', 'user.name', 'Test'], cwd: repositoryRoot });
    writeFileSync(join(repositoryRoot, 'a.txt'), 'one\n');
    runGit({ args: ['add', 'a.txt'], cwd: repositoryRoot });
    runGit({ args: ['commit', '-m', 'chore: first'], cwd: repositoryRoot });
    return repositoryRoot;
  };

  it('reads the branch, and reports a clean primary checkout as clean', () => {
    const checkout = repository();
    const result = readCheckoutFacts(checkout);
    expect(result.branch).toBe('main');
    expect(result.isDirty).toBe(false);
    expect(result.isPrimary).toBe(true);
  });

  it('reports a tracked modification as dirty', () => {
    const checkout = repository();
    writeFileSync(join(checkout, 'a.txt'), 'two\n');
    expect(readCheckoutFacts(checkout).isDirty).toBe(true);
  });

  it('ignores an untracked file, which survives a branch switch', () => {
    const checkout = repository();
    writeFileSync(join(checkout, 'untracked.txt'), 'x\n');
    expect(readCheckoutFacts(checkout).isDirty).toBe(false);
  });

  it('treats an unreadable git answer as dirty, the conservative direction', () => {
    const empty = mkdtempSync(join(tmpdir(), 'checkout-facts-'));
    const result = readCheckoutFacts(empty);
    expect(result.isDirty).toBe(true);
    expect(result.isPrimary).toBe(false);
  });
});
