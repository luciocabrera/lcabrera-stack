import type { LineChartPointsMode } from '#ui/components/LineChart/LineChart.types';

import type {
  ChartChoiceKey,
  ChartDensity,
  ChartToggleKey,
} from './ChartSettings.types';

export const CHART_DEFAULT_DENSITY = 'compact' satisfies ChartDensity;

export const CHART_DENSITY_SCALE: Readonly<Record<ChartDensity, number>> = {
  comfortable: 1.375,
  compact: 1,
  dense: 0.625,
  spacious: 1.75,
};

export const CHART_POINTS_OPTIONS: readonly {
  readonly label: string;
  readonly value: LineChartPointsMode;
}[] = [
  { label: 'Automatic', value: 'auto' },
  { label: 'Every point', value: 'always' },
  { label: 'Linked points only', value: 'never' },
];

export const CHART_AXIS_LABEL_STEP_OPTIONS = [
  { label: 'Every label', value: '1' },
  { label: 'Every 2nd label', value: '2' },
  { label: 'Every 5th label', value: '5' },
] as const;

export const CHART_TICK_COUNT_OPTIONS = [
  { label: 'Few', value: '3' },
  { label: 'Standard', value: '5' },
  { label: 'Many', value: '8' },
] as const;

export const CHART_CHOICE_TITLES: Readonly<Record<ChartChoiceKey, string>> = {
  axisLabelStep: 'Column labels',
  density: 'Density',
  points: 'Points',
  tickCount: 'Axis ticks',
};

export const CHART_TOGGLE_LABELS: Readonly<Record<ChartToggleKey, string>> = {
  hasLegend: 'Legend',
  hasMarkerLabels: 'Marker labels',
  isConnected: 'Line between points',
  isDataTableVisible: 'Data table',
};

export const CHART_TOGGLE_KEYS: readonly ChartToggleKey[] = [
  'hasLegend',
  'isDataTableVisible',
  'hasMarkerLabels',
  'isConnected',
];
