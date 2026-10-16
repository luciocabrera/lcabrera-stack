import { envelopeShapeSchema } from '@repo/eval-history/envelope/envelope.schema';
import { describe, expect, it } from 'vite-plus/test';

import regressionConfig from '../../../../../../evals/regression.config.json' with { type: 'json' };
import {
  EVALS_COST_LABELS,
  EVALS_FLAKY,
  EVALS_INTERVAL,
  EVALS_SUBJECT_KINDS,
} from './evalsDashboard.constants';

describe('EVALS_INTERVAL', () => {
  it('draws the interval the regression check judges with', () => {
    expect(EVALS_INTERVAL).toEqual({
      minTrialsForRate: regressionConfig.minTrialsForRate,
      z: regressionConfig.z,
    });
  });
});

describe('EVALS_FLAKY', () => {
  it('marks the tasks the regression check treats as flaky', () => {
    expect(EVALS_FLAKY).toEqual(regressionConfig.flaky);
  });
});

describe('EVALS_COST_LABELS', () => {
  it('never names the two costs alike', () => {
    expect(EVALS_COST_LABELS.reported).not.toBe(EVALS_COST_LABELS.computed);
  });
});

describe('EVALS_SUBJECT_KINDS', () => {
  it('names the subject kinds an envelope may record', () => {
    expect(EVALS_SUBJECT_KINDS).toEqual(
      envelopeShapeSchema.shape.subjects.element.shape.kind.options,
    );
  });
});
