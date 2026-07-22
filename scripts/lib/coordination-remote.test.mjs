import { describe, expect, it } from 'vitest';

import {
  dedupeById,
  parseLsRemoteHeads,
  readRemoteClaims,
  withoutLocalDuplicates,
} from './coordination-remote.mjs';

const SHA = 'a'.repeat(40);
const OTHER_SHA = 'b'.repeat(40);

const taskFile = (id) => `---
id: ${id}
title: A claim
owner: agent:claude
status: active
branch: theirs
area:
  - scripts/**
started: 2026-07-22
updated: 2026-07-22
plan: (none)
pr: (none)
issue: '#1'
---

body
`;

/**
 * A stand-in for `runGit` driven by a table of `argv.join(' ')` → stdout.
 * Anything not in the table returns `undefined`, exactly as a failing git call
 * does — so a test that forgets to stub something sees the real absent-answer
 * path rather than a crash.
 */
const fakeGit =
  (responses) =>
  ({ args }) =>
    responses[args.join(' ')];

const LS_REMOTE = 'ls-remote --heads origin';
const REV_PARSE = 'rev-parse --verify --quiet refs/remotes/origin/theirs';
const LS_TREE =
  'ls-tree -r --name-only refs/remotes/origin/theirs -- docs/coordination/tasks/';

describe('parseLsRemoteHeads', () => {
  it('pairs each branch with its sha and drops the default branch', () => {
    const parsed = parseLsRemoteHeads(
      `${SHA}\trefs/heads/main\n${OTHER_SHA}\trefs/heads/feat/x\n`,
    );

    expect(parsed).toEqual([{ branch: 'feat/x', sha: OTHER_SHA }]);
  });

  it('ignores tags and any other non-head ref', () => {
    expect(parseLsRemoteHeads(`${SHA}\trefs/tags/v1\n`)).toEqual([]);
  });

  it('returns nothing for empty or absent output', () => {
    expect(parseLsRemoteHeads('')).toEqual([]);
    expect(parseLsRemoteHeads(undefined)).toEqual([]);
  });
});

describe('readRemoteClaims', () => {
  it('reads a claim that exists only on another branch', () => {
    const { claims, readBranches, unreadBranches } = readRemoteClaims({
      cwd: '/repo',
      git: fakeGit({
        [LS_REMOTE]: `${SHA}\trefs/heads/theirs`,
        [LS_TREE]: 'docs/coordination/tasks/theirs.md',
        [REV_PARSE]: SHA,
        'show refs/remotes/origin/theirs:docs/coordination/tasks/theirs.md':
          taskFile('theirs'),
      }),
    });

    expect(readBranches).toEqual(['theirs']);
    expect(unreadBranches).toEqual([]);
    expect(claims).toHaveLength(1);
    expect(claims[0].data.id).toBe('theirs');
    expect(claims[0].name).toBe('theirs.md (branch theirs)');
  });

  it('reports a branch with no local ref instead of silently skipping it', () => {
    // The blind spot this module exists to remove: an unread branch that is
    // not reported reads exactly like a branch with no claims.
    const { claims, readBranches, unreadBranches } = readRemoteClaims({
      cwd: '/repo',
      git: fakeGit({ [LS_REMOTE]: `${SHA}\trefs/heads/theirs` }),
    });

    expect(claims).toEqual([]);
    expect(readBranches).toEqual([]);
    expect(unreadBranches).toEqual(['theirs']);
  });

  it('reports a local ref that is behind origin as unread', () => {
    // Stale is not the same as absent, but it is just as misleading: the ref
    // resolves, so the claims read cleanly — they are simply the wrong ones.
    const { readBranches, unreadBranches } = readRemoteClaims({
      cwd: '/repo',
      git: fakeGit({
        [LS_REMOTE]: `${SHA}\trefs/heads/theirs`,
        [REV_PARSE]: OTHER_SHA,
      }),
    });

    expect(readBranches).toEqual([]);
    expect(unreadBranches).toEqual(['theirs']);
  });

  it('flags the whole read as unavailable when origin cannot be reached', () => {
    const result = readRemoteClaims({ cwd: '/repo', git: fakeGit({}) });

    expect(result.unavailable).toBe(true);
    expect(result.claims).toEqual([]);
  });

  it('skips the register template', () => {
    const { claims } = readRemoteClaims({
      cwd: '/repo',
      git: fakeGit({
        [LS_REMOTE]: `${SHA}\trefs/heads/theirs`,
        [LS_TREE]: 'docs/coordination/tasks/_TEMPLATE.md',
        [REV_PARSE]: SHA,
      }),
    });

    expect(claims).toEqual([]);
  });
});

describe('dedupeById', () => {
  const copyOn = (branch) => ({
    branch,
    data: { branch: 'package-readmes', id: 'package-readmes' },
    name: `package-readmes.md (branch package-readmes)`,
  });

  it('collapses the copies every branch inherits into one claim', () => {
    // Found end-to-end, not by unit test: a task file committed to its own
    // branch is inherited by every branch cut from `main` afterwards, so one
    // claim was reported as four separate collisions with the same task.
    expect(
      dedupeById([copyOn('release-v0-1-1'), copyOn('ci/other'), copyOn('x')]),
    ).toHaveLength(1);
  });

  it('prefers the copy on the branch the claim itself declares', () => {
    const canonical = copyOn('package-readmes');

    expect(dedupeById([copyOn('ci/other'), canonical])[0]).toBe(canonical);
    expect(dedupeById([canonical, copyOn('ci/other')])[0]).toBe(canonical);
  });

  it('keeps claims with different ids', () => {
    expect(
      dedupeById([
        { branch: 'a', data: { id: 'one' }, name: 'one' },
        { branch: 'b', data: { id: 'two' }, name: 'two' },
      ]),
    ).toHaveLength(2);
  });
});

describe('withoutLocalDuplicates', () => {
  it('drops a remote claim already present in the working tree', () => {
    const remoteClaims = [
      { data: { id: 'shared' }, name: 'shared.md (origin/x)' },
    ];

    expect(
      withoutLocalDuplicates({
        localTasks: [{ data: { id: 'shared' }, name: 'shared.md' }],
        remoteClaims,
      }),
    ).toEqual([]);
  });

  it('keeps a remote claim the working tree does not have', () => {
    const remoteClaims = [
      { data: { id: 'theirs' }, name: 'theirs.md (origin/x)' },
    ];

    expect(
      withoutLocalDuplicates({
        localTasks: [{ data: { id: 'mine' }, name: 'mine.md' }],
        remoteClaims,
      }),
    ).toEqual(remoteClaims);
  });
});
