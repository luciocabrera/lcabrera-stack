import { describe, expect, expectTypeOf, it } from 'vite-plus/test';

import type { TrendSparklineTone } from './public-api';

import * as publicApi from './public-api';

describe('public API', () => {
  it.each(
    Object.entries(publicApi).map(([name, exported]) => ({ exported, name })),
  )('exports $name', ({ exported }) => {
    expect(exported).toBeDefined();
  });

  it('exports TrendSparkline as a component and its tone type', () => {
    expect(publicApi.TrendSparkline).toBeTypeOf('function');
    expectTypeOf<TrendSparklineTone>().toEqualTypeOf<
      'error' | 'info' | 'neutral' | 'success' | 'warning'
    >();
  });
});
