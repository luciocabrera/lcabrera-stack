import type { To } from 'react-router';

export type TrendPoint = {
  readonly label?: string;
  readonly to?: To;
  readonly tone?: TrendSparklineTone;
  readonly value: number;
};

export type TrendSparklineProps = {
  readonly height?: number;
  readonly isConnected?: boolean;
  readonly label: string;
  readonly max?: number;
  readonly points?: readonly TrendPoint[];
  readonly tone?: TrendSparklineTone;
  readonly values?: readonly number[];
  readonly width?: number;
};

export type TrendSparklineTone =
  | 'error'
  | 'info'
  | 'neutral'
  | 'success'
  | 'warning';
