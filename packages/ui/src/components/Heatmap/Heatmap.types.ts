import type { To } from 'react-router';

import type {
  ChartDensity,
  ChartFeatures,
  ChartSettingsValues,
} from '#ui/components/ChartSettings/ChartSettings.types';
import type { ChartTone } from '#ui/components/LineChart/LineChart.types';

export type HeatmapAxisItem = {
  readonly key: string;
  readonly label: string;
  readonly to?: To;
};

export type HeatmapCell = {
  readonly column: string;
  readonly label: string;
  readonly pattern?: HeatmapPattern;
  readonly row: string;
  readonly to?: To;
  /** Under a sequential scale this applies only when `value` is not finite. */
  readonly tone?: ChartTone;
  readonly value?: number;
};

export type HeatmapCellGeometry = {
  readonly columnIndex: number;
  readonly fill: HeatmapFill;
  readonly key: string;
  readonly label: string;
  readonly pattern: HeatmapPattern | undefined;
  readonly rowIndex: number;
  readonly to: To | undefined;
  readonly x: number;
  readonly y: number;
};

export type HeatmapFigureProps = Omit<HeatmapProps, 'density' | 'features'> & {
  readonly settings: ChartSettingsValues;
};

export type HeatmapFill =
  | { readonly kind: 'empty' }
  | { readonly kind: 'sequential'; readonly percent: string }
  | { readonly kind: 'tone'; readonly tone: ChartTone };

export type HeatmapLegendItem = {
  readonly label: string;
  readonly pattern?: HeatmapPattern;
  readonly tone?: ChartTone;
};

export type HeatmapLinkedCell = HeatmapCellGeometry & { readonly to: To };

export type HeatmapPattern = 'dots' | 'hatch';

export type HeatmapPatternIds = Readonly<Record<HeatmapPattern, string>>;

export type HeatmapProps = {
  readonly cells: readonly HeatmapCell[];
  /** The cell size at the `compact` density; the other levels scale it. */
  readonly cellSize?: number;
  readonly columns: readonly HeatmapAxisItem[];
  /** The density the chart opens at; the reader can change it in the settings. */
  readonly density?: ChartDensity;
  readonly description?: string;
  /** Each one unset is on. */
  readonly features?: ChartFeatures;
  readonly hasDataTable?: boolean;
  readonly legend?: readonly HeatmapLegendItem[];
  readonly rows: readonly HeatmapAxisItem[];
  readonly scale?: HeatmapScale;
  readonly title: string;
};

export type HeatmapRowGeometry = {
  readonly cells: readonly HeatmapCellGeometry[];
  readonly key: string;
  readonly label: string;
};

export type HeatmapScale =
  | { readonly domain: readonly [number, number]; readonly kind: 'sequential' }
  | { readonly kind: 'tone' };
