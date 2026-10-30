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

  const coordinates = points.map(({ x, y }, index) => ({
    index,
    x: Number(x),
    y,
  }));
  const xs = coordinates.map(({ x }) => x);
  const ys = coordinates.map(({ y }) => y);
  const bucketSize = (points.length - 2) / (threshold - 2);
  const bucketStart = (bucket: number) => Math.floor(bucket * bucketSize) + 1;

  const kept = Array.from(
    { length: threshold - 2 },
    (_, bucket) => bucket,
  ).reduce(
    (indexes, bucket) => {
      const anchor = indexes.at(-1) ?? NaN;
      const anchorX = xs[anchor] ?? NaN;
      const anchorY = ys[anchor] ?? NaN;
      const next = coordinates.slice(
        bucketStart(bucket + 1),
        bucketStart(bucket + 2),
      );
      const averageX = next.reduce((sum, { x }) => sum + x, 0) / next.length;
      const averageY = next.reduce((sum, { y }) => sum + y, 0) / next.length;
      const area = ({ x, y }: { readonly x: number; readonly y: number }) =>
        Math.abs(
          (anchorX - averageX) * (y - anchorY) -
            (anchorX - x) * (averageY - anchorY),
        );
      const best = coordinates
        .slice(bucketStart(bucket), bucketStart(bucket + 1))
        .reduce((winner, candidate) =>
          area(candidate) > area(winner) ? candidate : winner,
        );

      indexes.push(best.index);

      return indexes;
    },
    [0],
  );

  return points.filter(
    (_, index) => index === points.length - 1 || kept.includes(index),
  );
};
