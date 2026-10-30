import { linePath } from '@lcabrera/utils/chart/line-path.util';
import { scaleLinear } from '@lcabrera/utils/chart/scale-linear.util';

type GetTrendValuesLineArgs = {
  readonly height: number;
  readonly max?: number;
  readonly values: readonly number[];
  readonly width: number;
};

export const getTrendValuesLine = ({
  height,
  max,
  values,
  width,
}: GetTrendValuesLineArgs) => {
  const series = values.length === 1 ? [...values, ...values] : values;
  const x = scaleLinear({
    domain: [0, series.length - 1],
    range: [0, width],
  });
  const y = scaleLinear({
    domain: [Math.min(...values), max ?? Math.max(...values)],
    isClamped: true,
    range: [height, 0],
  });

  return linePath({
    points: series.map((value, index) => ({ x: index, y: value })),
    x,
    y,
  });
};
