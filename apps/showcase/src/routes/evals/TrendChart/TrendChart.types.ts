export type TrendChartMark = {
  readonly index: number;
  readonly key: string;
  readonly kind: 'annotation' | 'content' | 'model';
  readonly label: string;
};

export type TrendChartPoint = {
  readonly href: string;
  readonly key: string;
  readonly label: string;
  readonly lower?: number | undefined;
  readonly upper?: number | undefined;
  readonly value: number;
};

export type TrendChartProps = {
  readonly label: string;
  readonly marks: readonly TrendChartMark[];
  readonly points: readonly TrendChartPoint[];
};
