import { describe, expect, it } from 'vite-plus/test';

import type { RunSide } from './report.types.ts';

import { rateLine } from './rateLine.util.ts';

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

const thresholds = { minTrialsForRate: 6, z: 1.96 };

describe('rateLine', () => {
  it('prints both rates at the configured z', () => {
    expect(rateLine({ a: side, b: side, thresholds })).toBe(
      'Pass rate, Wilson interval at z=1.96: 90.0% (n=10, 60.0%–98.0%) → 90.0% (n=10, 60.0%–98.0%).',
    );
  });

  it('says how many trials a rate needs when either side is short', () => {
    expect(
      rateLine({
        a: side,
        b: { ...side, rate: { k: 1, kind: 'insufficient', n: 2 } },
        thresholds,
      }),
    ).toContain('A rate needs 6 counted trials');
  });
});
