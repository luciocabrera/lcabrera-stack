import { describe, expect, it } from 'vite-plus/test';

import { compareRuns } from './compareRuns.util.ts';
import { reportRunFixture } from './reportRunFixture.util.ts';

const thresholds = { minTrialsForRate: 6, z: 1.96 };

const main = reportRunFixture();

describe('compareRuns', () => {
  it('refuses two models and names both', () => {
    expect(
      compareRuns({
        a: main,
        b: { ...main, modelId: 'model-b', runId: 'run-b' },
        thresholds,
      }),
    ).toMatchObject({
      a: { modelId: 'model-a' },
      b: { modelId: 'model-b' },
      kind: 'refused',
      reason: 'model-changed',
    });
  });

  it('compares two models when allowed, and counts the model as a change', () => {
    expect(
      compareRuns({
        a: main,
        allowModelChange: true,
        b: { ...main, modelId: 'model-b' },
        thresholds,
      }),
    ).toMatchObject({
      changed: { changed: 'model', kind: 'single' },
      kind: 'comparison',
    });
  });

  it('refuses two suites even when a model change is allowed', () => {
    expect(
      compareRuns({
        a: main,
        allowModelChange: true,
        b: { ...main, suite: 'skill-quality' },
        thresholds,
      }),
    ).toMatchObject({ kind: 'refused', reason: 'suite-mismatch' });
  });

  it('reports each side with n, the excluded count, cost and the p50 duration', () => {
    const comparison = compareRuns({ a: main, b: main, thresholds });

    expect(comparison).toMatchObject({
      a: {
        costUsdReported: 1,
        durationP50Ms: 2000,
        excluded: 1,
        rate: { k: 2, kind: 'insufficient', n: 3 },
      },
      changed: { kind: 'none' },
      flips: [],
      kind: 'comparison',
    });
  });

  it('names two changed hashes as multiple causes', () => {
    expect(
      compareRuns({
        a: main,
        b: {
          ...main,
          catalogHash: 'cat2',
          subjects: [{ contentHash: 'c2', kind: 'skill', name: 'react-19' }],
        },
        thresholds,
      }),
    ).toMatchObject({
      changed: {
        changed: ['catalog', 'content:skill/react-19'],
        kind: 'multiple',
      },
    });
  });

  it('carries only the thresholds the comparison reads', () => {
    const regressionConfig = { ...thresholds, binary: { ofTrials: 3 } };

    expect(
      compareRuns({ a: main, b: main, thresholds: regressionConfig }),
    ).toHaveProperty('thresholds', { minTrialsForRate: 6, z: 1.96 });
  });
});
