import { describe, expect, it } from 'vite-plus/test';

import type { ReportRun } from './report.types.ts';

import { compareRuns } from './compareRuns.util.ts';

const thresholds = { minTrialsForRate: 6, z: 1.96 };

const main: ReportRun = {
  branch: 'main',
  catalogHash: 'cat1',
  costUsdReported: 1,
  durationsMs: [1000, 3000],
  gitSha: 'a'.repeat(40),
  harnessVersion: 'h1',
  modelId: 'model-a',
  runId: 'run-a',
  status: 'complete',
  subjects: [{ contentHash: 'c1', kind: 'skill', name: 'react-19' }],
  suite: 'skills',
  tasks: [
    {
      outcomes: ['pass', 'pass', 'fail', 'error'],
      taskHash: 't1',
      taskKey: 'skills/react-19/trigger-1',
    },
  ],
};

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
});
