import { describe, expect, it } from 'vite-plus/test';

import { flakyListing } from './flakyListing.util.ts';
import {
  reportRunFixture,
  reportTaskFixture,
} from './reportRunFixture.util.ts';

const row = (taskKey: string) => ({
  disagreeFraction: 0.3,
  disagreeing: 3,
  runs: 10,
  suite: 'skills' as const,
  taskKey,
});

describe('flakyListing', () => {
  it('gives each flaky task the two runs hold its trial split on each side', () => {
    const a = reportRunFixture({
      tasks: [reportTaskFixture({ outcomes: ['pass', 'pass', 'fail'] })],
    });
    const b = reportRunFixture({
      tasks: [reportTaskFixture({ outcomes: ['pass', 'fail', 'error'] })],
    });

    expect(
      flakyListing({
        a,
        b,
        rows: [row('skills/react-19/trigger-1'), row('skills/epic/trigger')],
      }),
    ).toEqual([
      {
        a: { excluded: 0, k: 2, n: 3 },
        b: { excluded: 1, k: 1, n: 2 },
        disagreeing: 3,
        runs: 10,
        taskKey: 'skills/react-19/trigger-1',
      },
    ]);
  });
});
