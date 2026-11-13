import type { To } from 'react-router';

import type {
  ChartDensity,
  ChartFeatures,
  ChartSettingsValues,
} from '#ui/components/ChartSettings/ChartSettings.types';

export type TrendPoint = {
  readonly label?: string;
  readonly to?: To;
  readonly tone?: TrendSparklineTone;
  readonly value: number;
};

export type TrendSparklineFigureProps = Omit<
  TrendSparklineChartProps,
  'density' | 'features'
> &
  (TrendSparklinePointsProps | TrendSparklineValuesProps) & {
    readonly settings: ChartSettingsValues;
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
  /** The density the chart opens at; the reader can change it in the settings. */
  readonly density?: ChartDensity;
  /** The role an empty chart keeps, named by `label`; unset, an empty chart leaves the accessibility tree. */
  readonly emptyRole?: 'group' | 'img';
  /** Each one unset is on; turn `settings` off where the sparkline sits inside another component. */
  readonly features?: ChartFeatures;
  /** The height at the `compact` density; the other levels scale it. */
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
