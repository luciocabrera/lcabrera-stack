import { describe, expect, it } from 'vite-plus/test';

import type { BaselineRow } from './baseline.types.ts';

import { baselineHeading } from './baselineHeading.util.ts';
import { baselineLine } from './baselineLine.util.ts';

const ROW: BaselineRow = {
  baselineId: '11111111-1111-4111-8111-111111111111',
  gitSha: 'abcdef0123456789abcdef0123456789abcdef01',
  mean: 0.75,
  metric: 'pass_rate',
  modelId: 'model-a',
  nRuns: 5,
  stddev: 0.125,
  subject: { kind: 'skill', name: 'react-19' },
  suite: 'skills',
};

describe('baselineLine', () => {
  it('names the subject, the metric, the mean, the spread and the runs', () => {
    expect(baselineLine(ROW)).toBe(
      'skill react-19 pass_rate: mean 0.7500, sd 0.1250 over 5 runs',
    );
    expect(baselineLine({ ...ROW, subject: undefined })).toBe(
      'suite skills pass_rate: mean 0.7500, sd 0.1250 over 5 runs',
    );
  });
});

describe('baselineHeading', () => {
  it('names the baseline, suite, model and short commit', () => {
    expect(baselineHeading(ROW)).toBe(
      'Baseline 11111111-1111-4111-8111-111111111111: skills on model-a at abcdef012345',
    );
  });
});
