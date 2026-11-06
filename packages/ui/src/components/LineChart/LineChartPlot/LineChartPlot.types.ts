import type { LineChartGeometry } from '#ui/components/LineChart/LineChart.types';

export type LineChartPlotProps = {
  readonly description?: string;
  readonly geometry: LineChartGeometry;
  readonly height: number;
  readonly title: string;
};
