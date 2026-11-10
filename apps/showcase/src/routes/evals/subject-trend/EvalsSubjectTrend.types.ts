import type { trendSeries } from './trendSeries.util';

export type SubjectTrendSeriesProps = {
  readonly kind: string;
  readonly name: string;
  readonly series: ReturnType<typeof trendSeries>[number];
};

export type TrendMark = {
  readonly href: string;
  readonly key: string;
  readonly kind: 'annotation' | 'content' | 'model';
  readonly label: string;
  readonly pointLabel: string;
  readonly startedAt: string;
};
