import { isFiniteNumber } from '@lcabrera/utils/guards/is-finite-number.util';

import type { ChartPoint, ChartScale, ChartValue } from './chart.types';

import { formatPathPoint } from './format-path-point.util';
import { isFiniteChartValue } from './is-finite-chart-value.util';

type LinePathArgs<X extends ChartValue> = {
  readonly points: readonly ChartPoint<X>[];
  readonly x: ChartScale<X>;
  readonly y: ChartScale;
};

export const linePath = <X extends ChartValue>({
  points,
  x,
  y,
}: LinePathArgs<X>) => {
  const isDrawn = (point: ChartPoint<X> | undefined) =>
    point !== undefined &&
    isFiniteChartValue(point.x) &&
    isFiniteNumber(point.y);

  return points.reduce((path, point, index) => {
    const { x: position, y: value } = point;

    if (!isFiniteChartValue(position) || !isFiniteNumber(value)) return path;

    const at = formatPathPoint({ x: x(position), y: y(value) });

    if (isDrawn(points[index - 1])) return `${path}L${at}`;

    return isDrawn(points[index + 1]) ? `${path}M${at}` : `${path}M${at}L${at}`;
  }, '');
};
