import { describe, expect, it } from 'vite-plus/test';

import { regressionConfigSchema } from '../stats/regressionConfig.schema.ts';
import { regressionConfigFixture } from './regressionConfigFixture.util.ts';

describe('regressionConfigFixture', () => {
  it('is a config the schema accepts', () => {
    expect(regressionConfigSchema.parse(regressionConfigFixture())).toEqual(
      regressionConfigFixture(),
    );
  });

  it('takes what the caller overrides', () => {
    expect(regressionConfigFixture({ minTrialsForRate: 3 })).toMatchObject({
      minTrialsForRate: 3,
      z: 1.96,
    });
  });
});
