/**
 * The cases here are the ones that made a blocked pull request look finished:
 * a thread GitHub marked `outdated` after the line moved, a thread whose
 * `isResolved` never came back, and a draft that must not be reported as broken
 * for having open threads. Each must fail toward "still holding the merge".
 */
import { describe, expect, it } from 'vite-plus/test';

import {
  decideThreadStatus,
  formatThreads,
  summarizeThreads,
} from './pr-threads.mjs';

const thread = (over = {}) => ({
  comments: {
    nodes: [
      {
        author: { login: 'copilot-pull-request-reviewer' },
        body: 'Consider a readonly mapped type here.',
        line: 39,
        path: 'src/a.ts',
      },
    ],
  },
  id: 'PRRT_1',
  isResolved: false,
  ...over,
});

describe('summarizeThreads', () => {
  it('carries the node id, which is what resolving one needs', () => {
    expect(summarizeThreads([thread()]).unresolved[0].id).toBe('PRRT_1');
  });

  it('counts an outdated-but-unresolved thread — the #646 trap', () => {
    const summary = summarizeThreads([thread({ isOutdated: true })]);
    expect(summary.unresolved).toHaveLength(1);
    expect(summary.unresolved[0].isOutdated).toBe(true);
  });

  it('treats a missing isResolved as unresolved, never as settled', () => {
    expect(summarizeThreads([{ id: 'x' }]).unresolved).toHaveLength(1);
  });

  it('drops a resolved thread but still counts it in the total', () => {
    const summary = summarizeThreads([thread({ isResolved: true }), thread()]);
    expect(summary).toMatchObject({ total: 2 });
    expect(summary.unresolved).toHaveLength(1);
  });

  it('survives a null comments branch', () => {
    const [only] = summarizeThreads([{ comments: null, id: 'y' }]).unresolved;
    expect(only).toMatchObject({ author: 'unknown', body: '', path: '' });
  });

  it('reads no threads from a null node list', () => {
    expect(summarizeThreads(undefined)).toEqual({ total: 0, unresolved: [] });
  });
});

describe('decideThreadStatus', () => {
  const threads = (open) => ({
    total: open,
    unresolved: Array.from({ length: open }, () => ({})),
  });

  it('fails while any thread is open', () => {
    expect(decideThreadStatus({ isDraft: false, threads: threads(2) })).toEqual(
      {
        description: '2 unresolved review thread(s) — address and resolve each',
        state: 'failure',
      },
    );
  });

  it('passes once every thread is resolved', () => {
    expect(
      decideThreadStatus({
        isDraft: false,
        threads: { total: 3, unresolved: [] },
      }),
    ).toMatchObject({ state: 'success' });
  });

  it('never fails a draft, but still says what is open', () => {
    const verdict = decideThreadStatus({ isDraft: true, threads: threads(2) });
    expect(verdict.state).toBe('success');
    expect(verdict.description).toContain('2 unresolved');
  });
});

describe('formatThreads', () => {
  const report = (threads) =>
    formatThreads({ number: 780, repository: 'o/r', threads }).join('\n');

  it('prints the id and location of each open thread', () => {
    const text = report(summarizeThreads([thread()]));
    expect(text).toContain('src/a.ts:39');
    expect(text).toContain('id: PRRT_1');
    expect(text).toContain('docs/agents/pr-review-threads.md');
  });

  it('marks an outdated thread as still counting', () => {
    expect(report(summarizeThreads([thread({ isOutdated: true })]))).toContain(
      'outdated — still counts',
    );
  });

  it('collapses a multi-line comment onto one line', () => {
    const wordy = thread({
      comments: { nodes: [{ body: 'first\n\n   second', path: 'a.ts' }] },
    });
    expect(report(summarizeThreads([wordy]))).toContain('first second');
  });

  it('says so plainly when nothing is open', () => {
    expect(report(summarizeThreads([thread({ isResolved: true })]))).toContain(
      'no unresolved review threads (1 total)',
    );
  });
});
