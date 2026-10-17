import { describe, expect, it } from 'vite-plus/test';

import type { RunSide } from './report.types.ts';

import { statusLines } from './statusLines.util.ts';

const side: RunSide = {
  branch: 'main',
  costUsdReported: 1.2,
  durationP50Ms: 13_000,
  excluded: 0,
  gitSha: 'a'.repeat(40),
  modelId: 'model-a',
  rate: { k: 9, kind: 'rate', lower: 0.6, n: 10, rate: 0.9, upper: 0.98 },
  runId: 'run-a',
  status: 'complete',
};

const labels = { a: 'main', b: 'feat/x' };

describe('statusLines', () => {
  it('says nothing about two complete runs', () => {
    expect(statusLines({ comparison: { a: side, b: side }, labels })).toEqual(
      [],
    );
  });

  it('names each partial or aborted run', () => {
    expect(
      statusLines({
        comparison: {
          a: { ...side, status: 'partial' },
          b: { ...side, status: 'aborted' },
        },
        labels,
      }),
    ).toEqual([
      'main is a partial run, so it holds only the trials that finished.',
      'feat/x is an aborted run, so it holds only the trials that finished.',
    ]);
  });
});
