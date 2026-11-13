import type { ReactNode } from 'react';

import type { LineChartPointsMode } from '#ui/components/LineChart/LineChart.types';
import type { TableDensity } from '#ui/components/Table/Table.types';

export type ChartChoiceKey =
  | 'axisLabelStep'
  | 'density'
  | 'points'
  | 'tickCount';

export type ChartChoiceOption = {
  readonly label: string;
  readonly value: string;
};

export type ChartDensity = TableDensity;

export type ChartFeatures = {
  /** The settings button and the drawer it opens; defaults to on. */
  readonly settings?: boolean;
};

export type ChartSettingsLayout = 'block' | 'inline';

export type ChartSettingsProps = {
  readonly initialSettings: ChartSettingsValues;
  readonly label: string;
  readonly layout?: ChartSettingsLayout;
  readonly renderChart: (settings: ChartSettingsValues) => ReactNode;
};

export type ChartSettingsState = {
  readonly applied: ChartSettingsValues;
  readonly draft: ChartSettingsValues;
  readonly isOpen: boolean;
  readonly isPinned: boolean;
};

export type ChartSettingsValues = {
  readonly axisLabelStep?: number;
  readonly density: ChartDensity;
  readonly hasLegend?: boolean;
  readonly hasMarkerLabels?: boolean;
  readonly isConnected?: boolean;
  readonly isDataTableVisible?: boolean;
  readonly points?: LineChartPointsMode;
  readonly tickCount?: number;
};

export type ChartToggleKey =
  | 'hasLegend'
  | 'hasMarkerLabels'
  | 'isConnected'
  | 'isDataTableVisible';
