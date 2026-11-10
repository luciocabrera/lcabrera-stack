import type { TrendChartMark } from '../TrendChart';
import type { trendSeries } from './trendSeries.util';

export type SubjectTrendSeriesProps = {
  readonly kind: string;
  readonly name: string;
  readonly series: ReturnType<typeof trendSeries>[number];
};

export type TrendMark = TrendChartMark & {
  readonly href: string;
  readonly pointLabel: string;
};
