import { isFiniteChartValue } from '@lcabrera/utils/chart/is-finite-chart-value.util';

import type { ChartX } from '#ui/components/LineChart/LineChart.types';

export const formatChartValue = (value: ChartX) =>
  value instanceof Date && isFiniteChartValue(value)
    ? value.toISOString().slice(0, 10)
    : String(value);
