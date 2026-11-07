import type {
  HeatmapPattern,
  HeatmapPatternIds,
} from '#ui/components/Heatmap/Heatmap.types';

export type HeatmapPatternDefsProps = {
  readonly patternIds: HeatmapPatternIds;
  readonly patterns: readonly HeatmapPattern[];
};
