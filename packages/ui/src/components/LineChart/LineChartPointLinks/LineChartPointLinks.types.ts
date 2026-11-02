import type { To } from 'react-router';

import type {
  LineChartDotGeometry,
  LineChartSeriesGeometry,
} from '#ui/components/LineChart/LineChart.types';

export type LineChartLinkedDot = LineChartDotGeometry & { readonly to: To };

export type LineChartPointLinksProps = {
  readonly series: readonly Pick<LineChartSeriesGeometry, 'dots' | 'id'>[];
};
