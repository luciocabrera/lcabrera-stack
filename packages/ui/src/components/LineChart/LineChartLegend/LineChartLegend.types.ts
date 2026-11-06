import type { LineChartSeriesGeometry } from '#ui/components/LineChart/LineChart.types';

export type LineChartLegendProps = {
  readonly series: readonly Pick<
    LineChartSeriesGeometry,
    'id' | 'isDashed' | 'label' | 'tone'
  >[];
};
