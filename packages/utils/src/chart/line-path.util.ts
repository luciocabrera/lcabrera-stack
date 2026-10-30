import { isFiniteNumber } from '@lcabrera/utils/guards/is-finite-number.util';

import type { ChartPoint, ChartScale, ChartValue } from './chart.types';

import { formatPathPoint } from './format-path-point.util';

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
    point !== undefined && isFiniteNumber(point.y);

  return points.reduce((path, point, index) => {
    if (!isFiniteNumber(point.y)) return path;

    const at = formatPathPoint({ x: x(point.x), y: y(point.y) });

    if (isDrawn(points[index - 1])) return `${path}L${at}`;

    return isDrawn(points[index + 1]) ? `${path}M${at}` : `${path}M${at}L${at}`;
  }, '');
};
