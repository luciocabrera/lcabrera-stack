import type { RunTrial } from '@repo/eval-history/queries/queries.types';

import { describe, expect, it } from 'vite-plus/test';

import { trialSummaryLabel } from './trialSummaryLabel.util';

const trial = {
  costUsd: 0.02,
  durationMs: 12_000,
  errorClass: undefined,
  outcome: 'pass',
  taskKey: 'skills/react-19/trigger-1',
  trialId: '41',
  trialIndex: 2,
  turns: 3,
} as RunTrial;

describe('trialSummaryLabel', () => {
  it('sums up one trial in a sentence', () => {
    expect(trialSummaryLabel(trial)).toBe(
      'Trial 41: skills/react-19/trigger-1 trial 2, pass, 12s, 3 turns, $0.02.',
    );
  });

  it('names the error class and the figures that are missing', () => {
    expect(
      trialSummaryLabel({
        ...trial,
        costUsd: undefined,
        durationMs: undefined,
        errorClass: 'timeout_exceeded',
        outcome: 'error',
        turns: undefined,
      }),
    ).toBe(
      'Trial 41: skills/react-19/trigger-1 trial 2, error (timeout_exceeded), no duration, turns unknown, not reported.',
    );
  });
});
