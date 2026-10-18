import { describe, expect, it } from 'vite-plus/test';

import type { Refusal } from './report.types.ts';

import { refusalText } from './refusalText.util.ts';

const side = {
  branch: 'main',
  gitSha: 'a'.repeat(40),
  modelId: 'model-a',
  runId: 'run-a',
  suite: 'skills',
} as const;

const refusal = (reason: Refusal['reason']): Refusal => ({
  a: side,
  b: { ...side, modelId: undefined, suite: 'verifier-fixtures' },
  kind: 'refused',
  reason,
  regression: undefined,
  suite: 'verifier-fixtures',
});

describe('refusalText', () => {
  it('names both models and the flag that compares them anyway', () => {
    const text = refusalText(refusal('model-changed'));

    expect(text).toContain('Run A used `model-a` and run B used `no model`.');
    expect(text).toContain('--allow-model-change');
  });

  it('names both suites', () => {
    expect(refusalText(refusal('suite-mismatch'))).toBe(
      'Run A is from the skills suite and run B from the verifier-fixtures suite. Only runs of one suite share tasks to compare.',
    );
  });
});
