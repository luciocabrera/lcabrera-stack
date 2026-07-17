export type TrendSparklineProps = {
  readonly height?: number;
  /**
   * Accessible name for the rendered chart (e.g. 'High-severity findings per
   * scan'). Required: a populated sparkline is exposed as `role='img'`, and an
   * image with no name is announced as just "image". Ignored while `values` is
   * empty, since the chart is then hidden from assistive tech entirely.
   */
  readonly label: string;
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
