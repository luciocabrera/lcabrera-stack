import { describe, expect, it } from 'vite-plus/test';

import regressionConfig from '../../../../../../evals/regression.config.json' with { type: 'json' };
import { EVALS_INTERVAL } from './evalsDashboard.constants';

describe('EVALS_INTERVAL', () => {
  it('draws the interval the regression check judges with', () => {
    expect(EVALS_INTERVAL).toEqual({
      minTrialsForRate: regressionConfig.minTrialsForRate,
      z: regressionConfig.z,
    });
  });
});
