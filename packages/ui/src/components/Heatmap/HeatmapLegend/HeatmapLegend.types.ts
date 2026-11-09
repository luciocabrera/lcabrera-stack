import type {
  HeatmapLegendItem,
  HeatmapPatternIds,
  HeatmapScale,
} from '#ui/components/Heatmap/Heatmap.types';

export type HeatmapLegendProps = {
  readonly items: readonly HeatmapLegendItem[] | undefined;
  readonly patternIds: HeatmapPatternIds;
  readonly scale: HeatmapScale | undefined;
};
