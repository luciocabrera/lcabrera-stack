import { isFiniteNumber } from '@lcabrera/utils/guards/is-finite-number.util';

import type {
  LineChartFormatters,
  LineSeries,
} from '#ui/components/LineChart/LineChart.types';

import { LINE_CHART } from '#ui/components/LineChart/LineChart.constants';

type GetDataTableRowsArgs = {
  readonly formatters: LineChartFormatters;
  readonly series: readonly LineSeries[];
};

export const getDataTableRows = ({
  formatters,
  series,
}: GetDataTableRowsArgs) =>
  series.flatMap(({ id, label, points }) =>
    points.map((point, index) => ({
      key: `${id}-${String(index)}`,
      series: label,
      to: point.to,
      x: formatters.x(point.x),
      y: isFiniteNumber(point.y)
        ? formatters.y(point.y)
        : LINE_CHART.missingValue,
    })),
  );
