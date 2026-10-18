import { describe, expect, it } from 'vite-plus/test';

import { compareRuns } from './compareRuns.util.ts';
import { regressionConfigFixture } from './regressionConfigFixture.util.ts';
import {
  reportRunFixture,
  reportTaskFixture,
} from './reportRunFixture.util.ts';

const thresholds = regressionConfigFixture();

const history = { kind: 'needs-database' } as const;

const main = reportRunFixture();

describe('compareRuns', () => {
  it('refuses two models and names both', () => {
    expect(
      compareRuns({
        a: main,
        b: { ...main, modelId: 'model-b', runId: 'run-b' },
        history,
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
        history,
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
        history,
        thresholds,
      }),
    ).toMatchObject({ kind: 'refused', reason: 'suite-mismatch' });
  });

  it('reports each side with n, the excluded count, cost and the p50 duration', () => {
    const comparison = compareRuns({ a: main, b: main, history, thresholds });

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
        history,
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
    expect(
      compareRuns({ a: main, b: main, history, thresholds }),
    ).toHaveProperty('thresholds', { minTrialsForRate: 6, z: 1.96 });
  });

  it('names no cause for a task only one run reached', () => {
    const comparison = compareRuns({
      a: main,
      b: { ...main, tasks: [] },
      history,
      thresholds,
    });

    expect(comparison).toMatchObject({
      changed: { kind: 'none' },
      flips: [{ taskKey: 'skills/react-19/trigger-1' }],
    });
  });

  it('names no cause for a subject only one run reached', () => {
    const storePattern = {
      contentHash: 'c-store',
      kind: 'skill',
      name: 'store-pattern',
    } as const;
    const storeTask = reportTaskFixture({
      outcomes: ['pass'],
      subject: { kind: 'skill', name: 'store-pattern' },
      taskHash: 't-store',
      taskKey: 'skills/store-pattern/trigger-1',
    });
    const complete = {
      ...main,
      subjects: [...main.subjects, storePattern],
      tasks: [...main.tasks, storeTask],
    };

    expect(
      compareRuns({ a: complete, b: main, history, thresholds }),
    ).toMatchObject({
      changed: { kind: 'none' },
      flips: [{ taskKey: 'skills/store-pattern/trigger-1' }],
    });
  });
});
