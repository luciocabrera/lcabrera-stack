import type { trendSeries } from './trendSeries.util';

export type SubjectTrendSeriesProps = {
  readonly kind: string;
  readonly name: string;
  readonly series: ReturnType<typeof trendSeries>[number];
};
