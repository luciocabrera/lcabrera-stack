import type { ScoredBaselineRow } from './report.types.ts';

export const scoredBaselineRowFixture = (skill: string | undefined) =>
  ({
    harnessVersion: 'h1',
    mean: 4,
    modelId: 'model-a',
    nRuns: 5,
    stddev: 0.25,
    subject: skill === undefined ? undefined : { kind: 'skill', name: skill },
  }) satisfies ScoredBaselineRow;
