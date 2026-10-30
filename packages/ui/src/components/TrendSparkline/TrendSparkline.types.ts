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
  readonly label: string;
  readonly max?: number;
  readonly tone?: TrendSparklineTone;
  readonly width?: number;
};

type TrendSparklinePointsProps = {
  readonly isConnected?: boolean;
  readonly points: readonly TrendPoint[];
  readonly values?: never;
};

type TrendSparklineValuesProps = {
  readonly isConnected?: never;
  readonly points?: never;
  readonly values: readonly number[];
};
