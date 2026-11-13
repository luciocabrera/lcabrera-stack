import type {
  HeatmapAxisItem,
  HeatmapRowGeometry,
} from '#ui/components/Heatmap/Heatmap.types';

export type HeatmapDataTableProps = {
  readonly columns: readonly HeatmapAxisItem[];
  readonly isVisible: boolean;
  readonly rows: readonly HeatmapRowGeometry[];
  readonly title: string;
};
