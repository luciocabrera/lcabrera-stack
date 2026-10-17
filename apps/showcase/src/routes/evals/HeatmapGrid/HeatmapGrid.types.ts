import type { heatmapGrids } from '../heatmap/heatmapGrids.util';

export type HeatmapGridProps = {
  readonly grid: ReturnType<typeof heatmapGrids>[number];
};
