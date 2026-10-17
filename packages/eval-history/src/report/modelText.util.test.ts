import { describe, expect, it } from 'vite-plus/test';

import type { RunSide } from './report.types.ts';

import { modelText } from './modelText.util.ts';

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

describe('modelText', () => {
  it('names one model once', () => {
    expect(modelText({ a: side, b: side })).toBe('model-a');
  });

  it('names both when the model changed, and says when one is missing', () => {
    expect(modelText({ a: side, b: { ...side, modelId: undefined } })).toBe(
      'model-a → no model',
    );
  });
});
