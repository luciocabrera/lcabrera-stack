import type { ChartTone } from './LineChart.types';

export const LINE_CHART = {
  autoDotLimit: 24,
  dayMs: 86_400_000,
  decimateThreshold: 1000,
  defaultHeight: 240,
  missingValue: 'No value',
  plotSize: 100,
  tickCount: 5,
  unitDomain: [0, 1],
} as const;

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
