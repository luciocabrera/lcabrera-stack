import type {
  LineChartDrawnPoint,
  LineChartFormatters,
} from '#ui/components/LineChart/LineChart.types';

type GetPointNameArgs = {
  readonly formatters: LineChartFormatters;
  readonly point: LineChartDrawnPoint;
  readonly seriesLabel: string;
};

export const getPointName = ({
  formatters,
  point,
  seriesLabel,
}: GetPointNameArgs) =>
  point.label ??
  `${seriesLabel}: ${formatters.x(point.x)}, ${formatters.y(point.y)}`;
