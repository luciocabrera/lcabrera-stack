import { describe, expect, it } from 'vite-plus/test';

import { formatChartValue } from './formatChartValue.util';
import { getLineChartFormatters } from './getLineChartFormatters.util';

const x = (value: Date | number) => `x${String(value)}`;
const y = (value: number) => `y${String(value)}`;

describe('getLineChartFormatters', () => {
  it('takes the format each axis names', () => {
    expect(
      getLineChartFormatters({ xAxis: { format: x }, yAxis: { format: y } }),
    ).toEqual({ x, y });
  });

  it('falls back to the default format on an axis without one', () => {
    expect(getLineChartFormatters({ xAxis: {}, yAxis: undefined })).toEqual({
      x: formatChartValue,
      y: formatChartValue,
    });
  });
});
