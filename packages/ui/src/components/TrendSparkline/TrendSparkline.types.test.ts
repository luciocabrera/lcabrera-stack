import { describe, expectTypeOf, it } from 'vite-plus/test';

import type { TrendSparklineProps } from './TrendSparkline.types';

describe('TrendSparklineProps', () => {
  it('takes values or points', () => {
    expectTypeOf<{
      readonly label: string;
      readonly values: readonly number[];
    }>().toExtend<TrendSparklineProps>();
    expectTypeOf<{
      readonly label: string;
      readonly points: readonly [{ readonly value: 1 }];
    }>().toExtend<TrendSparklineProps>();
    expectTypeOf<{
      readonly isConnected: false;
      readonly label: string;
      readonly points: readonly [{ readonly value: 1 }];
    }>().toExtend<TrendSparklineProps>();
  });

  it('refuses isConnected on a values chart', () => {
    expectTypeOf<{
      readonly isConnected: false;
      readonly label: string;
      readonly values: readonly number[];
    }>().not.toExtend<TrendSparklineProps>();
  });

  it('refuses values and points together, and neither', () => {
    expectTypeOf<{
      readonly label: string;
      readonly points: readonly [{ readonly value: 1 }];
      readonly values: readonly number[];
    }>().not.toExtend<TrendSparklineProps>();
    expectTypeOf<{
      readonly label: string;
    }>().not.toExtend<TrendSparklineProps>();
  });
});
