export type SparklinePoint = {
  readonly href: string;
  readonly key: string;
  readonly label: string;
  readonly tone?: SparklineTone;
  readonly value: number;
};

export type SparklineProps = {
  readonly isConnected?: boolean;
  readonly label: string;
  readonly maxValue?: number;
  readonly points: readonly SparklinePoint[];
};

export type SparklineTone = 'error' | 'neutral' | 'success';
