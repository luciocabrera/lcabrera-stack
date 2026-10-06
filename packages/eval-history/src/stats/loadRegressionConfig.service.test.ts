import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vite-plus/test';

import type { Outcome, RegressionConfig, TaskTrials } from './stats.types.ts';

import { binaryRegression } from './binaryRegression.util.ts';
import { loadRegressionConfig } from './loadRegressionConfig.service.ts';

const file = fileURLToPath(
  new URL('../../../../evals/regression.config.json', import.meta.url),
);

const loadEdited = async (edit: (config: RegressionConfig) => unknown) => {
  const committed = await loadRegressionConfig({ file });

  return loadRegressionConfig({
    file,
    readText: async () => JSON.stringify(edit(committed)),
  });
};

const identity = { harnessVersion: 'aaaaaaaaaaaa', modelId: 'model-a' };
const tasks = (outcomesAt: (index: number) => readonly Outcome[]) =>
  Array.from({ length: 10 }, (_, index): TaskTrials => ({
    outcomes: outcomesAt(index),
    set: 'regression',
    taskKey: `task-${index}`,
  }));
const decide = (config: RegressionConfig) =>
  binaryRegression({
    config,
    flaky: [],
    main: { identity, tasks: tasks(() => ['pass', 'pass', 'pass']) },
    pr: {
      identity,
      tasks: tasks((index) =>
        index === 0 ? ['fail', 'pass', 'fail'] : ['pass', 'pass', 'pass'],
      ),
    },
  }).kind;

describe('loadRegressionConfig', () => {
  it('loads the committed config with the PRD defaults', async () => {
    expect(await loadRegressionConfig({ file })).toEqual({
      baseline: { defaultRuns: 5 },
      binary: { flip: { failAtLeast: 2, ofTrials: 3 } },
      flaky: { disagreeFraction: 0.2, window: 10 },
      minTrialsForRate: 6,
      scored: { sigma: 2 },
      z: 1.96,
    });
  });

  it('moves the decision when a threshold in the file changes', async () => {
    expect(decide(await loadRegressionConfig({ file }))).toBe('regression');
    expect(
      decide(
        await loadEdited((config) => ({
          ...config,
          binary: { flip: { failAtLeast: 3, ofTrials: 3 } },
        })),
      ),
    ).toBe('clear');
  });

  it('rejects a config that fails the schema, naming the file and the field', async () => {
    await expect(
      loadEdited((config) => ({ ...config, z: -1 })),
    ).rejects.toThrow(/regression\.config\.json[\s\S]*z/u);
    await expect(
      loadEdited((config) => ({ ...config, minTrials: 6 })),
    ).rejects.toThrow(/minTrials/u);
    await expect(
      loadEdited((config) => ({
        ...config,
        binary: { flip: { failAtLeast: 4, ofTrials: 3 } },
      })),
    ).rejects.toThrow(/failAtLeast/u);
  });
});
