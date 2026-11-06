import { LINE_CHART } from '#ui/components/LineChart/LineChart.constants';

export const isWithinPlot = (at: number) =>
  at >= 0 && at <= LINE_CHART.plotSize;
