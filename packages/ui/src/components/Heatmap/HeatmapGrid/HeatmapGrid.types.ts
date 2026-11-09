import type {
  HeatmapLinkedCell,
  HeatmapRowGeometry,
} from '#ui/components/Heatmap/Heatmap.types';

export type HeatmapGridProps = {
  readonly descriptionId: string | undefined;
  readonly firstLinked: HeatmapLinkedCell;
  readonly linked: readonly HeatmapLinkedCell[];
  readonly rows: readonly HeatmapRowGeometry[];
  readonly titleId: string;
};
