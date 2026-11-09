import type { HeatmapCellGeometry } from '#ui/components/Heatmap/Heatmap.types';

export type HeatmapGridRowProps = {
  readonly cells: readonly HeatmapCellGeometry[];
  readonly tabStopKey: string | undefined;
};
