import type {
  LineChartFormatters,
  LineSeries,
} from '#ui/components/LineChart/LineChart.types';

export type LineChartDataTableProps = {
  readonly formatters: LineChartFormatters;
  readonly isVisible: boolean;
  readonly series: readonly LineSeries[];
  readonly title: string;
  readonly xLabel?: string;
  readonly yLabel?: string;
};
