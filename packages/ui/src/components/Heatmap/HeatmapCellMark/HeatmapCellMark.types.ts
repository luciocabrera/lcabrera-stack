import type {
  HeatmapCellGeometry,
  HeatmapPatternIds,
} from '#ui/components/Heatmap/Heatmap.types';

export type HeatmapCellMarkProps = {
  readonly cell: HeatmapCellGeometry;
  readonly name: string | undefined;
  readonly patternIds: HeatmapPatternIds;
  readonly size: number;
};
