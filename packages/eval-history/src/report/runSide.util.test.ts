import { describe, expect, it } from 'vite-plus/test';

import { reportRunFixture } from './reportRunFixture.util.ts';
import { runSide } from './runSide.util.ts';

const run = reportRunFixture();

const thresholds = { minTrialsForRate: 6, z: 1.96 };

describe('runSide', () => {
  it("counts the run's trials, its median duration and its cost", () => {
    expect(runSide({ run, thresholds })).toEqual({
      branch: 'main',
      costUsdReported: 1,
      durationP50Ms: 2000,
      excluded: 1,
      gitSha: 'a'.repeat(40),
      modelId: 'model-a',
      rate: { k: 2, kind: 'insufficient', n: 3 },
      runId: 'run-a',
      status: 'complete',
    });
  });

  it('computes a rate once enough trials were counted', () => {
    expect(
      runSide({ run, thresholds: { minTrialsForRate: 3, z: 1.96 } }).rate,
    ).toMatchObject({ kind: 'rate', n: 3, rate: 2 / 3 });
  });
});
