export type TrendSparklineProps = {
  readonly height?: number;
  /** Caller decides what a trend "means" (e.g. rising errors → 'error') — this component has no domain opinion. */
  readonly tone?: TrendSparklineTone;
  /** Chronological, oldest first. */
  readonly values: readonly number[];
  readonly width?: number;
};

export type TrendSparklineTone =
  | 'error'
  | 'info'
  | 'neutral'
  | 'success'
  | 'warning';
