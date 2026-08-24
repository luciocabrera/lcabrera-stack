export type TrendSparklineProps = {
  readonly height?: number;
  readonly label: string;
  readonly tone?: TrendSparklineTone;
  readonly values: readonly number[];
  readonly width?: number;
};

export type TrendSparklineTone =
  | 'error'
  | 'info'
  | 'neutral'
  | 'success'
  | 'warning';
