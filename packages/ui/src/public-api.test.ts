import { describe, expect, expectTypeOf, it } from 'vite-plus/test';

import type {
  ChartTone,
  HeatmapPattern,
  LineChartPointsMode,
  TrendSparklineTone,
} from './public-api';

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

  it('exports LineChart as a component with its tone and points types', () => {
    expect(publicApi.LineChart).toBeTypeOf('function');
    expectTypeOf<ChartTone>().toEqualTypeOf<
      'error' | 'info' | 'neutral' | 'secondary' | 'success' | 'warning'
    >();
    expectTypeOf<LineChartPointsMode>().toEqualTypeOf<
      'always' | 'auto' | 'never'
    >();
  });

  it('exports Heatmap as a component with its pattern type', () => {
    expect(publicApi.Heatmap).toBeTypeOf('function');
    expectTypeOf<HeatmapPattern>().toEqualTypeOf<'dots' | 'hatch'>();
  });
});
