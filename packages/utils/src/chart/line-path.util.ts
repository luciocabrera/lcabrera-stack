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
}: LinePathArgs<X>) =>
  points.reduce((path, point, index) => {
    if (!isFiniteNumber(point.y)) return path;

    const previous = points[index - 1];
    const command =
      previous === undefined || !isFiniteNumber(previous.y) ? 'M' : 'L';

    return `${path}${command}${formatPathPoint({ x: x(point.x), y: y(point.y) })}`;
  }, '');
