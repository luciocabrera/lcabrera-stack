import { isFiniteNumber } from '@lcabrera/utils/guards/is-finite-number.util';

import type { ChartBandPoint, ChartScale, ChartValue } from './chart.types';

import { formatPathPoint } from './format-path-point.util';

type BandPathArgs<X extends ChartValue> = {
  readonly band: readonly ChartBandPoint<X>[];
  readonly x: ChartScale<X>;
  readonly y: ChartScale;
};

type DefinedBandPoint<X extends ChartValue> = {
  readonly lower: number;
  readonly upper: number;
  readonly x: X;
};

export const bandPath = <X extends ChartValue>({
  band,
  x,
  y,
}: BandPathArgs<X>) => {
  const segments: DefinedBandPoint<X>[][] = [];
  let current: DefinedBandPoint<X>[] = [];

  for (const { lower, upper, x: at } of band) {
    if (!isFiniteNumber(lower) || !isFiniteNumber(upper)) {
      current = [];
      continue;
    }

    if (current.length === 0) segments.push(current);

    current.push({ lower, upper, x: at });
  }

  return segments
    .map((segment) => {
      const upperEdge = segment.map((point) =>
        formatPathPoint({ x: x(point.x), y: y(point.upper) }),
      );
      const lowerEdge = segment
        .toReversed()
        .map((point) => formatPathPoint({ x: x(point.x), y: y(point.lower) }));

      return `M${[...upperEdge, ...lowerEdge].join('L')}Z`;
    })
    .join('');
};
