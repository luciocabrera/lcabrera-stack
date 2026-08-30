/**
 * Every case here is a shape that makes a real PR look healthier than it is —
 * an in-flight check with a null conclusion, a thread whose resolution field is
 * missing, a GraphQL branch that came back null. The normalizer has to fail
 * toward "not clean" on all of them.
 */
import { describe, expect, it } from 'vite-plus/test';

import {
  normalizeCheck,
  summarizeChecks,
  summarizeQueue,
  summarizeThreads,
  toFacts,
} from './pr-queue-facts.mjs';

describe('normalizeCheck', () => {
  it('reads a running CheckRun from status, not its null conclusion', () => {
    expect(
      normalizeCheck({
        __typename: 'CheckRun',
        conclusion: null,
        name: 'Quality Gate',
        status: 'IN_PROGRESS',
      }),
    ).toEqual({ name: 'Quality Gate', state: 'IN_PROGRESS', url: '' });
  });

  it('prefers the conclusion once a CheckRun has finished', () => {
    expect(
      normalizeCheck({
        __typename: 'CheckRun',
        conclusion: 'FAILURE',
        name: 'Tests',
        status: 'COMPLETED',
      }).state,
    ).toBe('FAILURE');
  });

  it('flattens a StatusContext, which uses different field names entirely', () => {
    expect(
      normalizeCheck({
        __typename: 'StatusContext',
        context: 'SonarCloud',
        state: 'SUCCESS',
        targetUrl: 'https://x',
      }),
    ).toEqual({ name: 'SonarCloud', state: 'SUCCESS', url: 'https://x' });
  });
});

describe('summarizeChecks', () => {
  it('buckets a mixed rollup and never loses a check', () => {
    const summary = summarizeChecks([
      { __typename: 'CheckRun', conclusion: 'SUCCESS', name: 'a' },
      { __typename: 'CheckRun', conclusion: 'FAILURE', name: 'b' },
      { __typename: 'CheckRun', conclusion: null, name: 'c', status: 'QUEUED' },
      { __typename: 'CheckRun', conclusion: 'TIMED_OUT', name: 'd' },
    ]);
    expect(summary.all).toHaveLength(4);
    expect(summary.failed.map((check) => check.name)).toEqual(['b', 'd']);
    expect(summary.pending.map((check) => check.name)).toEqual(['c']);
  });

  it('treats a missing rollup as no checks, not as success', () => {
    expect(summarizeChecks(undefined).all).toEqual([]);
  });
});

describe('summarizeThreads', () => {
  it('counts a thread with no resolution field as unresolved', () => {
    expect(
      summarizeThreads([{ comments: { nodes: [] } }]).unresolved,
    ).toHaveLength(1);
  });

  it('counts an outdated thread — the line moved, the question did not', () => {
    const summary = summarizeThreads([
      {
        comments: {
          nodes: [{ author: { login: 'copilot' }, body: 'x', path: 'a.ts' }],
        },
        isOutdated: true,
        isResolved: false,
      },
    ]);
    expect(summary.unresolved[0]).toEqual({
      author: 'copilot',
      body: 'x',
      id: '',
      isOutdated: true,
      line: undefined,
      path: 'a.ts',
    });
  });

  it('drops a resolved thread', () => {
    expect(summarizeThreads([{ isResolved: true }]).unresolved).toEqual([]);
  });
});

describe('toFacts', () => {
  it('survives a node whose every optional branch is null', () => {
    const facts = toFacts({ number: 7 });
    expect(facts).toMatchObject({
      author: 'unknown',
      isDraft: false,
      mergeable: 'UNKNOWN',
      number: 7,
      size: 0,
    });
    expect(facts.checks.all).toEqual([]);
    expect(facts.threads.unresolved).toEqual([]);
  });

  it('sums the diff size across every changed file', () => {
    const facts = toFacts({
      files: {
        nodes: [
          { additions: 10, deletions: 2, path: 'a.ts' },
          { additions: 1, deletions: 1, path: 'b.ts' },
        ],
      },
      number: 8,
    });
    expect(facts.size).toBe(14);
  });

  it('reaches the rollup through the last commit', () => {
    const facts = toFacts({
      commits: {
        nodes: [
          {
            commit: {
              statusCheckRollup: {
                contexts: {
                  nodes: [
                    {
                      __typename: 'CheckRun',
                      conclusion: 'FAILURE',
                      name: 'x',
                    },
                  ],
                },
              },
            },
          },
        ],
      },
      number: 9,
    });
    expect(facts.checks.failed.map((check) => check.name)).toEqual(['x']);
  });
});

describe('summarizeQueue', () => {
  it('reads a pull request sitting in the queue', () => {
    expect(
      summarizeQueue({
        isInMergeQueue: true,
        isMergeQueueEnabled: true,
        mergeQueueEntry: { position: 0, state: 'AWAITING_CHECKS' },
        timelineItems: { nodes: [{ __typename: 'AddedToMergeQueueEvent' }] },
      }),
    ).toEqual({
      ejectedAt: '',
      ejectedReason: '',
      enabled: true,
      position: 0,
      queued: true,
      state: 'AWAITING_CHECKS',
    });
  });

  it('records an ejection, which no check on the pull request reports', () => {
    const queue = summarizeQueue({
      isInMergeQueue: false,
      isMergeQueueEnabled: true,
      timelineItems: {
        nodes: [
          {
            __typename: 'RemovedFromMergeQueueEvent',
            createdAt: '2026-08-30T12:00:00Z',
            reason: 'checks failed',
          },
        ],
      },
    });
    expect(queue.ejectedAt).toBe('2026-08-30T12:00:00Z');
    expect(queue.ejectedReason).toBe('checks failed');
    expect(queue.queued).toBe(false);
  });

  it('treats a re-queue as clearing the ejection, since it is the later event', () => {
    expect(
      summarizeQueue({
        isInMergeQueue: true,
        isMergeQueueEnabled: true,
        timelineItems: { nodes: [{ __typename: 'AddedToMergeQueueEvent' }] },
      }).ejectedAt,
    ).toBe('');
  });

  it('reads a repository with no queue at all as not enabled, not ejected', () => {
    expect(summarizeQueue({ number: 1 })).toEqual({
      ejectedAt: '',
      ejectedReason: '',
      enabled: false,
      position: undefined,
      queued: false,
      state: '',
    });
  });
});
