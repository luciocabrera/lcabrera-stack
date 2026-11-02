import { isFiniteChartValue } from '@lcabrera/utils/chart/is-finite-chart-value.util';

import type {
  ChartMarker,
  ChartX,
  LineSeries,
} from '#ui/components/LineChart/LineChart.types';

import { getExtent } from './getExtent.util';

type GetChartDomainsArgs = {
  readonly markers: readonly ChartMarker[];
  readonly series: readonly LineSeries[];
  readonly xDomain?: readonly [ChartX, ChartX];
  readonly yDomain?: readonly [number, number];
};

export const getChartDomains = ({
  markers,
  series,
  xDomain,
  yDomain,
}: GetChartDomainsArgs) => {
  const xs = [
    ...series.flatMap(({ band = [], points }) => [
      ...points.map(({ x }) => x),
      ...band.map(({ x }) => x),
    ]),
    ...markers.map(({ x }) => x),
  ].filter((x) => isFiniteChartValue(x));
  const ys = series.flatMap(({ band = [], points }) => [
    ...points.map(({ y }) => y ?? NaN),
    ...band.flatMap(({ lower, upper }) => [lower, upper]),
  ]);

  return {
    isTime: (xDomain ?? xs).some((x) => x instanceof Date),
    x:
      xDomain === undefined
        ? getExtent(xs.map(Number))
        : ([Number(xDomain[0]), Number(xDomain[1])] as const),
    y: yDomain ?? getExtent(ys),
  };
};
