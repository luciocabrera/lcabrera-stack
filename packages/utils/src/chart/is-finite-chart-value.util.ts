import { isFiniteNumber } from '@lcabrera/utils/guards/is-finite-number.util';

import type { ChartValue } from './chart.types';

export const isFiniteChartValue = (value: unknown): value is ChartValue =>
  isFiniteNumber(value instanceof Date ? value.getTime() : value);
