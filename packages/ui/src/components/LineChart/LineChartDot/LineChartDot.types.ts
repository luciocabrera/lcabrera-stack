import type { LineChartDotGeometry } from '#ui/components/LineChart/LineChart.types';

export type LineChartDotProps = Pick<
  LineChartDotGeometry,
  'd' | 'label' | 'tone'
>;
