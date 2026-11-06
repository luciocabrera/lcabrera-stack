import { isFiniteChartValue } from '@lcabrera/utils/chart/is-finite-chart-value.util';
import { isFiniteNumber } from '@lcabrera/utils/guards/is-finite-number.util';

import type {
  ChartPoint,
  LineChartDrawnPoint,
} from '#ui/components/LineChart/LineChart.types';

export const isDrawnPoint = (point: ChartPoint): point is LineChartDrawnPoint =>
  isFiniteChartValue(point.x) && isFiniteNumber(point.y);
