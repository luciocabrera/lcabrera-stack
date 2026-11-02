import type { LineChartTick } from '#ui/components/LineChart/LineChart.types';

export type LineChartTicksProps = {
  readonly axis: 'x' | 'y';
  readonly ticks: readonly LineChartTick[];
};
