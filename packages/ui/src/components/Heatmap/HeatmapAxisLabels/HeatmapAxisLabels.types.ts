import type { HeatmapAxisItem } from '#ui/components/Heatmap/Heatmap.types';

export type HeatmapAxisLabelsProps = {
  readonly axis: 'column' | 'row';
  readonly cellSize: number;
  readonly items: readonly HeatmapAxisItem[];
  readonly step?: number;
};
