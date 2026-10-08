import type { SparklinePoint } from './Sparkline.types';

type SparklineGeometryArgs = {
  readonly height: number;
  readonly maxValue?: number;
  readonly padding: number;
  readonly points: readonly SparklinePoint[];
  readonly width: number;
};

export const sparklineGeometry = ({
  height,
  maxValue,
  padding,
  points,
  width,
}: SparklineGeometryArgs) => {
  const top = maxValue ?? Math.max(0, ...points.map(({ value }) => value));
  const span = top > 0 ? top : 1;
  const innerWidth = width - 2 * padding;
  const innerHeight = height - 2 * padding;
  const round = (value: number) => Math.round(value * 100) / 100;
  const dots = points.map((point, index) => ({
    ...point,
    cx: round(
      padding +
        (points.length > 1
          ? (index * innerWidth) / (points.length - 1)
          : innerWidth / 2),
    ),
    cy: round(
      height -
        padding -
        (Math.min(Math.max(point.value, 0), span) / span) * innerHeight,
    ),
  }));

  return {
    dots,
    line: dots.map(({ cx, cy }) => `${String(cx)},${String(cy)}`).join(' '),
  };
};
