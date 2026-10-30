import { linePath } from '@lcabrera/utils/chart/line-path.util';
import { scaleLinear } from '@lcabrera/utils/chart/scale-linear.util';
import { isFiniteNumber } from '@lcabrera/utils/guards/is-finite-number.util';
import { roundToCents } from '@lcabrera/utils/numbers/round-to-cents.util';

import type { TrendPoint } from '#ui/components/TrendSparkline/TrendSparkline.types';

import { TREND_SPARKLINE_DOT } from '#ui/components/TrendSparkline/TrendSparkline.constants';

type GetTrendPointsGeometryArgs = {
  readonly height: number;
  readonly isConnected: boolean;
  readonly max?: number;
  readonly points: readonly TrendPoint[];
  readonly width: number;
};

export const getTrendPointsGeometry = ({
  height,
  isConnected,
  max,
  points,
  width,
}: GetTrendPointsGeometryArgs) => {
  const values = points.map(({ value }) => value);
  const finiteValues = values.filter((value) => isFiniteNumber(value));
  const bottom = Math.min(0, ...finiteValues);
  const top = max ?? Math.max(0, ...finiteValues);
  const x = scaleLinear({
    domain: [0, points.length - 1],
    range: [TREND_SPARKLINE_DOT.inset, width - TREND_SPARKLINE_DOT.inset],
  });
  const y = scaleLinear({
    domain: [bottom, top > bottom ? top : bottom + 1],
    isClamped: true,
    range: [height - TREND_SPARKLINE_DOT.inset, TREND_SPARKLINE_DOT.inset],
  });
  const line = isConnected
    ? linePath({
        points: values.map((value, index) => ({ x: index, y: value })),
        x,
        y,
      })
    : '';

  return {
    dots: points
      .map((point, index) => ({
        ...point,
        cx: roundToCents(x(index)),
        cy: roundToCents(y(point.value)),
        position: index,
      }))
      .filter(({ value }) => isFiniteNumber(value)),
    line,
  };
};
