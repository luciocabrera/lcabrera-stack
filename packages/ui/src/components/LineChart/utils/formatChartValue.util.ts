import { isFiniteChartValue } from '@lcabrera/utils/chart/is-finite-chart-value.util';

import type { ChartX } from '#ui/components/LineChart/LineChart.types';

import { formatUtcTime } from './formatUtcTime.util';

export const formatChartValue = (value: ChartX) => {
  if (!(value instanceof Date) || !isFiniteChartValue(value))
    return String(value);

  const iso = value.toISOString();
  const time = formatUtcTime(iso);

  return time === '' ? iso.slice(0, 10) : `${iso.slice(0, 10)} ${time}`;
};
