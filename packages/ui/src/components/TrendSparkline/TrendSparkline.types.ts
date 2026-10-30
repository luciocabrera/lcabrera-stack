import type { To } from 'react-router';

export type TrendPoint = {
  readonly label?: string;
  readonly to?: To;
  readonly tone?: TrendSparklineTone;
  readonly value: number;
};

export type TrendSparklineProps = TrendSparklineChartProps &
  (TrendSparklinePointsProps | TrendSparklineValuesProps);

export type TrendSparklineTone =
  | 'error'
  | 'info'
  | 'neutral'
  | 'success'
  | 'warning';

type TrendSparklineChartProps = {
  readonly height?: number;
  readonly isConnected?: boolean;
  readonly label: string;
  readonly max?: number;
  readonly tone?: TrendSparklineTone;
  readonly width?: number;
};

type TrendSparklinePointsProps = {
  readonly points: readonly TrendPoint[];
  readonly values?: never;
};

type TrendSparklineValuesProps = {
  readonly points?: never;
  readonly values: readonly number[];
};
