import { roundToCents } from '@lcabrera/utils/numbers/round-to-cents.util';

import type { TrendChartMark, TrendChartPoint } from './TrendChart.types';

type TrendGeometryArgs = {
  readonly height: number;
  readonly marks: readonly TrendChartMark[];
  readonly padding: number;
  readonly points: readonly TrendChartPoint[];
  readonly width: number;
};

export const trendGeometry = ({
  height,
  marks,
  padding,
  points,
  width,
}: TrendGeometryArgs) => {
  const innerWidth = width - 2 * padding;
  const innerHeight = height - 2 * padding;
  const x = (index: number) =>
    roundToCents(
      padding +
        (points.length > 1
          ? (index * innerWidth) / (points.length - 1)
          : innerWidth / 2),
    );
  const y = (value: number) =>
    roundToCents(
      height - padding - Math.min(Math.max(value, 0), 1) * innerHeight,
    );
  const dots = points.map((point, index) => ({
    ...point,
    cx: x(index),
    cy: y(point.value),
  }));
  const upper = points.map(
    (point, index) =>
      `${String(x(index))},${String(y(point.upper ?? point.value))}`,
  );
  const lower = points
    .map(
      (point, index) =>
        `${String(x(index))},${String(y(point.lower ?? point.value))}`,
    )
    .toReversed();

  return {
    band: [...upper, ...lower].join(' '),
    bottom: y(0),
    dots,
    line: dots.map(({ cx, cy }) => `${String(cx)},${String(cy)}`).join(' '),
    marks: marks
      .filter(({ index }) => index >= 0 && index < points.length)
      .map((mark) => ({ ...mark, x: x(mark.index) })),
    top: y(1),
  };
};
