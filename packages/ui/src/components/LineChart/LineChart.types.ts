import type { ChartScale } from '@lcabrera/utils/chart/chart.types';
import type { To } from 'react-router';

export type ChartAxis<T extends ChartX> = {
  /** A domain narrower than the data clips the line and band and drops the dots outside it. */
  readonly domain?: readonly [T, T];
  readonly format?: (value: T) => string;
  readonly label?: string;
  readonly ticks?: readonly T[];
};

export type ChartMarker = {
  readonly label: string;
  readonly to?: To;
  readonly tone?: ChartTone;
  readonly x: ChartX;
};

export type ChartPoint = {
  readonly label?: string;
  readonly to?: To;
  readonly tone?: ChartTone;
  readonly x: ChartX;
  readonly y: null | number;
};

export type ChartTone =
  | 'error'
  | 'info'
  | 'neutral'
  | 'secondary'
  | 'success'
  | 'warning';

export type ChartX = Date | number;

export type LineBandPoint = {
  readonly lower: number;
  readonly upper: number;
  readonly x: ChartX;
};

export type LineChartDotGeometry = {
  readonly d: string;
  readonly key: string;
  readonly label: string;
  readonly left: number;
  readonly to: To | undefined;
  readonly tone: ChartTone;
  readonly top: number;
};

export type LineChartDrawnPoint = ChartPoint & { readonly y: number };

export type LineChartFormatters = {
  readonly x: (value: ChartX) => string;
  readonly y: (value: number) => string;
};

export type LineChartGeometry = {
  readonly gridlines: string;
  readonly markers: readonly LineChartMarkerGeometry[];
  readonly series: readonly LineChartSeriesGeometry[];
  readonly xTicks: readonly LineChartTick[];
  readonly yTicks: readonly LineChartTick[];
};

export type LineChartMarkerGeometry = {
  readonly at: number;
  readonly d: string;
  readonly key: string;
  readonly label: string;
  readonly to: To | undefined;
  readonly tone: ChartTone;
};

export type LineChartPointsMode = 'always' | 'auto' | 'never';

export type LineChartProps = {
  readonly description?: string;
  readonly hasDataTable?: boolean;
  readonly height?: number;
  readonly markers?: readonly ChartMarker[];
  /** `auto` draws linked, toned and short-series points; a linked point is drawn in every mode, so its link stays reachable. */
  readonly points?: LineChartPointsMode;
  readonly series: readonly LineSeries[];
  readonly title: string;
  readonly xAxis?: ChartAxis<ChartX>;
  readonly yAxis?: ChartAxis<number>;
};

export type LineChartScales = {
  readonly x: ChartScale<ChartX>;
  readonly y: ChartScale;
};

export type LineChartSeriesGeometry = {
  readonly band: string;
  readonly dots: readonly LineChartDotGeometry[];
  readonly id: string;
  readonly isDashed: boolean;
  readonly label: string;
  readonly line: string;
  readonly tone: ChartTone;
};

export type LineChartTick = {
  readonly at: number;
  readonly key: string;
  readonly text: string;
};

export type LineSeries = {
  readonly band?: readonly LineBandPoint[];
  readonly id: string;
  readonly isDashed?: boolean;
  readonly label: string;
  readonly points: readonly ChartPoint[];
  readonly tone?: ChartTone;
};
