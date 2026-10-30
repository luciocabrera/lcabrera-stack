import type { ChartValue } from './chart.types';

type DecimateArgs<T extends DecimatePoint> = {
  readonly points: readonly T[];
  readonly threshold: number;
};

type DecimatePoint = {
  readonly x: ChartValue;
  readonly y: number;
};

export const decimate = <T extends DecimatePoint>({
  points,
  threshold,
}: DecimateArgs<T>) => {
  if (threshold < 3 || threshold >= points.length) return points;

  const coordinates = points.map(({ x, y }) => ({ x: Number(x), y }));
  const xs = coordinates.map(({ x }) => x);
  const ys = coordinates.map(({ y }) => y);
  const buckets = threshold - 2;
  const bucketSize = (points.length - 2) / buckets;
  const bucketStart = (bucket: number) => Math.floor(bucket * bucketSize) + 1;

  const kept = Array.from({ length: buckets }, (_, bucket) => bucket).reduce(
    (indexes, bucket) => {
      const anchor = indexes.at(-1) ?? 0;
      const anchorX = xs[anchor] ?? 0;
      const anchorY = ys[anchor] ?? 0;
      const start = bucketStart(bucket);
      const end = bucketStart(bucket + 1);
      const next = coordinates.slice(end, bucketStart(bucket + 2));
      const averageX = next.reduce((sum, { x }) => sum + x, 0) / next.length;
      const averageY = next.reduce((sum, { y }) => sum + y, 0) / next.length;
      const areas = coordinates
        .slice(start, end)
        .map(({ x, y }) =>
          Math.abs(
            (anchorX - averageX) * (y - anchorY) -
              (anchorX - x) * (averageY - anchorY),
          ),
        );
      const largest = areas.reduce((max, area) => Math.max(max, area), 0);

      indexes.push(start + areas.indexOf(largest));

      return indexes;
    },
    [0],
  );
  const keptIndexes = new Set(kept);

  return points.filter(
    (_, index) => index === points.length - 1 || keptIndexes.has(index),
  );
};
