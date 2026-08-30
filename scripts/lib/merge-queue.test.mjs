/**
 * The cases here are the ones that would let a merge-group run report green
 * having checked nothing: a ref that names no pull request, an event with no
 * pull request in it at all, and a title or body carrying the shape that would
 * inject a second variable into `$GITHUB_ENV`.
 */
import { describe, expect, it } from 'vite-plus/test';

import {
  envBlock,
  pullNumberFromQueueRef,
  statusSha,
  subjectEnv,
  subjectRequest,
} from './merge-queue.mjs';

const QUEUE_REF = 'refs/heads/gh-readonly-queue/main/pr-1038-dc1a0017abcdef0';

describe('pullNumberFromQueueRef', () => {
  it('reads the entry a merge queue names in its ref', () => {
    expect(pullNumberFromQueueRef(QUEUE_REF)).toBe(1038);
  });

  it('reads it through a base branch containing a slash', () => {
    expect(
      pullNumberFromQueueRef(
        'refs/heads/gh-readonly-queue/release/next/pr-7-0123456',
      ),
    ).toBe(7);
  });

  it('refuses a ref that is not a queue branch', () => {
    expect(pullNumberFromQueueRef('refs/heads/ci/1034-merge-queue')).toBe(
      undefined,
    );
  });

  it('refuses a queue-shaped ref with no entry on the end', () => {
    expect(pullNumberFromQueueRef('refs/heads/gh-readonly-queue/main')).toBe(
      undefined,
    );
  });

  it('refuses a missing ref rather than reading it as pull request NaN', () => {
    expect(pullNumberFromQueueRef(undefined)).toBe(undefined);
  });
});

describe('subjectRequest', () => {
  it('takes the pull request straight off a pull_request payload', () => {
    const pullRequest = {
      base: { sha: 'base1' },
      head: { sha: 'head1' },
      number: 42,
    };
    expect(
      subjectRequest({
        eventName: 'pull_request',
        payload: { pull_request: pullRequest },
      }),
    ).toEqual({
      number: 42,
      pullRequest,
      range: { baseSha: 'base1', headSha: 'head1' },
    });
  });

  it('ranges a merge group from its parent commit to the group itself', () => {
    expect(
      subjectRequest({
        eventName: 'merge_group',
        payload: {
          merge_group: {
            base_sha: 'parent1',
            head_ref: QUEUE_REF,
            head_sha: 'group1',
          },
        },
      }),
    ).toEqual({
      number: 1038,
      range: { baseSha: 'parent1', headSha: 'group1' },
    });
  });

  it('errors on a merge group whose ref names no pull request', () => {
    const request = subjectRequest({
      eventName: 'merge_group',
      payload: { merge_group: { head_ref: 'refs/heads/main' } },
    });
    expect(request.error).toContain('names no pull request');
    expect(request.number).toBe(undefined);
  });

  it('errors on an event that cannot carry a pull request', () => {
    expect(subjectRequest({ eventName: 'push', payload: {} }).error).toContain(
      '`push`',
    );
  });
});

describe('statusSha', () => {
  it('is the merge group commit inside the queue', () => {
    expect(
      statusSha({
        eventName: 'merge_group',
        payload: { merge_group: { head_sha: 'group1' } },
      }),
    ).toBe('group1');
  });

  it('is undefined elsewhere, so the caller keeps using the head it read', () => {
    expect(
      statusSha({ eventName: 'pull_request', payload: { pull_request: {} } }),
    ).toBe(undefined);
  });
});

describe('subjectEnv', () => {
  const pullRequest = {
    base: { ref: 'main' },
    body: 'body',
    head: { ref: 'ci/1-x', repo: { full_name: 'owner/repo' }, sha: 'head1' },
    number: 7,
    title: 'ci(x): y',
  };

  it('names the variables the existing gates already read', () => {
    expect(
      subjectEnv({
        pullRequest,
        range: { baseSha: 'b', headSha: 'h' },
        repository: 'owner/repo',
      }),
    ).toEqual({
      BRANCH_NAME: 'ci/1-x',
      PR_BASE: 'main',
      PR_BODY: 'body',
      PR_HEAD_SHA: 'head1',
      PR_IS_FORK: 'false',
      PR_NUMBER: '7',
      PR_TITLE: 'ci(x): y',
      RANGE_BASE_SHA: 'b',
      RANGE_HEAD_SHA: 'h',
    });
  });

  it('reports a fork, so a tokenless context is not asked for a secret', () => {
    expect(
      subjectEnv({
        pullRequest: {
          ...pullRequest,
          head: { ...pullRequest.head, repo: { full_name: 'someone/fork' } },
        },
        range: { baseSha: 'b', headSha: 'h' },
        repository: 'owner/repo',
      }).PR_IS_FORK,
    ).toBe('true');
  });
});

describe('envBlock', () => {
  it('writes every value as a heredoc, so a newline cannot add a variable', () => {
    expect(envBlock({ PR_BODY: 'one\ntwo' }, 'D')).toBe(
      'PR_BODY<<D\none\ntwo\nD\n',
    );
  });

  it('throws rather than writing a value that closes its own heredoc', () => {
    expect(() => envBlock({ PR_TITLE: 'x D y' }, 'D')).toThrow(
      /heredoc delimiter/u,
    );
  });
});
