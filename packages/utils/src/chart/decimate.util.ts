import { isFiniteNumber } from '@lcabrera/utils/guards/is-finite-number.util';
import { isNonEmptyArray } from '@lcabrera/utils/guards/is-non-empty-array.util';

import type { ChartPoint, ChartValue } from './chart.types';

import { isFiniteChartValue } from './is-finite-chart-value.util';

type DecimateArgs<T extends ChartPoint<ChartValue>> = {
  readonly points: readonly T[];
  readonly threshold: number;
};

type DecimateValue = {
  readonly index: number;
  readonly x: ChartValue;
  readonly y: number;
};

export const decimate = <T extends ChartPoint<ChartValue>>({
  points,
  threshold,
}: DecimateArgs<T>) => {
  const coordinates = points
    .map(({ x, y }, index) => ({ index, x, y }))
    .filter(
      (point): point is DecimateValue =>
        isFiniteChartValue(point.x) && isFiniteNumber(point.y),
    )
    .map(({ index, x, y }) => ({ index, x: Number(x), y }));

  if (
    !isNonEmptyArray(coordinates) ||
    threshold < 3 ||
    threshold >= coordinates.length
  )
    return points;

  const [head] = coordinates;

  const buckets = threshold - 2;
  const bucketSize = (coordinates.length - 2) / buckets;
  const bucketStart = (bucket: number) => Math.floor(bucket * bucketSize) + 1;
  const bucketIndexes = Array.from({ length: buckets }).keys();
  const kept = new Set([head, ...coordinates.slice(-1)]);
  let anchor = head;

  for (const bucket of bucketIndexes) {
    const end = bucketStart(bucket + 1);
    const next = coordinates.slice(end, bucketStart(bucket + 2));
    const averageX = next.reduce((sum, { x }) => sum + x, 0) / next.length;
    const averageY = next.reduce((sum, { y }) => sum + y, 0) / next.length;
    const candidates = coordinates.slice(bucketStart(bucket), end);
    let winner = anchor;
    let largest = -1;

    for (const candidate of candidates) {
      const area = Math.abs(
        (anchor.x - averageX) * (candidate.y - anchor.y) -
          (anchor.x - candidate.x) * (averageY - anchor.y),
      );

      if (area <= largest) continue;

      winner = candidate;
      largest = area;
    }

    kept.add(winner);
    anchor = winner;
  }

  const dropped = new Set(
    coordinates
      .filter((coordinate) => !kept.has(coordinate))
      .map(({ index }) => index),
  );

  return points.filter((_, index) => !dropped.has(index));
};
