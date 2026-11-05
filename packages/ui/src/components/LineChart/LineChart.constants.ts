import type { ChartTone } from './LineChart.types';

export const LINE_CHART = {
  autoDotLimit: 24,
  clipMargin: 1,
  decimateThreshold: 1000,
  defaultHeight: 240,
  maxTimeTicks: 8,
  missingValue: 'No value',
  plotSize: 100,
  tickCount: 5,
  unitDomain: [0, 1],
} as const;

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export const LINE_CHART_TIME_STEPS: readonly number[] = [
  1,
  10,
  100,
  SECOND,
  5 * SECOND,
  15 * SECOND,
  30 * SECOND,
  MINUTE,
  5 * MINUTE,
  15 * MINUTE,
  30 * MINUTE,
  HOUR,
  3 * HOUR,
  6 * HOUR,
  12 * HOUR,
  DAY,
  2 * DAY,
  7 * DAY,
  14 * DAY,
];

export const LINE_CHART_MONTH_STEPS: readonly number[] = [1, 2, 3, 6, 12];

export const LINE_CHART_TABLE_HEADINGS = {
  series: 'Series',
  x: 'x',
  y: 'y',
} as const;

export const LINE_CHART_DEFAULT_TONE = 'neutral' satisfies ChartTone;

export const LINE_CHART_SERIES_TONES: readonly ChartTone[] = [
  'info',
  'success',
  'warning',
  'error',
  'secondary',
  'neutral',
];
