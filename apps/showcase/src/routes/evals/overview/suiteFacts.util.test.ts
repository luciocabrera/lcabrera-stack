import { describe, expect, it } from 'vite-plus/test';

import type { RunFigures } from '../types/runFigures.types';

import { suiteFacts } from './suiteFacts.util';

const LATEST = {
  branch: 'feat/x',
  costUsd: 1.8,
  durationMs: 300_000,
  gitSha: '602ecaae'.padEnd(40, '0'),
  k: 6,
  lower: 0.2,
  n: 15,
  rate: 0.4,
  startedAt: '2026-10-14T02:00:00.000Z',
  upper: 0.64,
} as RunFigures;

describe('suiteFacts', () => {
  it('lists the six facts of the latest run in order', () => {
    expect(
      suiteFacts({
        flakyLeftOut: ['t1'],
        latest: LATEST,
        points: [],
        suite: 's',
      }),
    ).toEqual([
      { term: 'Pass rate', value: '40% (6/15)' },
      { term: 'Interval', value: '20% to 64%' },
      { term: 'Cost', value: '$1.80' },
      { term: 'Duration', value: '5m 0s' },
      { term: 'Flaky, left out', to: '/evals/flaky', value: '1 tasks' },
      { term: 'Run', value: '2026-10-14 02:00 on feat/x at 602ecaae' },
    ]);
  });

  it('says there is no main pair to judge, with no link, when none was judged', () => {
    expect(suiteFacts({ latest: LATEST, points: [], suite: 's' })[4]).toEqual({
      term: 'Flaky, left out',
      value: 'no main pair to judge',
    });
  });

  it('links an empty flaky list as zero tasks', () => {
    expect(
      suiteFacts({
        flakyLeftOut: [],
        latest: LATEST,
        points: [],
        suite: 's',
      })[4],
    ).toEqual({
      term: 'Flaky, left out',
      to: '/evals/flaky',
      value: '0 tasks',
    });
  });
});
