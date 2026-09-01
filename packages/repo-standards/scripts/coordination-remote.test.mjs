import { describe, expect, it } from 'vite-plus/test';

import {
  dedupeById,
  parseLsRemoteHeads,
  readRemoteClaims,
  withoutLocalDuplicates,
  withoutMergedBranches,
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

  it('drops the default branch it is given, not the literal `main`', () => {
    const parsed = parseLsRemoteHeads(
      `${SHA}\trefs/heads/trunk\n${OTHER_SHA}\trefs/heads/main\n`,
      'trunk',
    );

    expect(parsed).toEqual([{ branch: 'main', sha: OTHER_SHA }]);
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
    const { claims, readBranches, unreadBranches } = readRemoteClaims({
      cwd: '/repo',
      git: fakeGit({ [LS_REMOTE]: `${SHA}\trefs/heads/theirs` }),
    });

    expect(claims).toEqual([]);
    expect(readBranches).toEqual([]);
    expect(unreadBranches).toEqual(['theirs']);
  });

  it('reports a local ref that is behind origin as unread', () => {
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

describe('withoutMergedBranches', () => {
  const claimOn = (branch) => ({ branch: 'inherited', data: { branch } });

  it('drops a claim whose branch was deleted when its PR merged', () => {
    expect(
      withoutMergedBranches({
        claims: [claimOn('merged-and-gone')],
        liveBranches: ['still-open'],
      }),
    ).toEqual([]);
  });

  it('keeps a claim whose branch is still live', () => {
    const live = claimOn('still-open');

    expect(
      withoutMergedBranches({ claims: [live], liveBranches: ['still-open'] }),
    ).toEqual([live]);
  });

  it('keeps a claim on main, which ls-remote output excludes', () => {
    const onMain = claimOn('main');

    expect(
      withoutMergedBranches({ claims: [onMain], liveBranches: [] }),
    ).toEqual([onMain]);
  });

  it('keeps placeholder branches, which say nothing about being done', () => {
    const placeholder = claimOn('(uncommitted)');

    expect(
      withoutMergedBranches({ claims: [placeholder], liveBranches: [] }),
    ).toEqual([placeholder]);
  });
});

describe('dedupeById', () => {
  const copyOn = (branch) => ({
    branch,
    data: { branch: 'package-readmes', id: 'package-readmes' },
    name: `package-readmes.md (branch package-readmes)`,
  });

  it('collapses the copies every branch inherits into one claim', () => {
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
