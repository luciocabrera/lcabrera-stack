import type { ChartSettingsChartProps } from './ChartSettingsChart.types';

import { useGetChartSettings } from '../contexts/selectors';

export const ChartSettingsChart = ({ renderChart }: ChartSettingsChartProps) =>
  renderChart(useGetChartSettings());
