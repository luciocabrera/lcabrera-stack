import { isFiniteChartValue } from '@lcabrera/utils/chart/is-finite-chart-value.util';

import type { ChartX } from '#ui/components/LineChart/LineChart.types';

import { formatUtcTime } from './formatUtcTime.util';

export const formatChartValue = (value: ChartX) => {
  if (!(value instanceof Date) || !isFiniteChartValue(value))
    return String(value);

  const day = value.toISOString().slice(0, 10);
  const time = formatUtcTime(value);

  return time === '' ? day : `${day} ${time}`;
};
