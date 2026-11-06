import type {
  HeatmapPattern,
  HeatmapPatternIds,
  HeatmapRowGeometry,
} from '#ui/components/Heatmap/Heatmap.types';

export type HeatmapPlotProps = {
  readonly description: string | undefined;
  readonly descriptionId: string | undefined;
  readonly height: number;
  readonly isGrid: boolean;
  readonly patternIds: HeatmapPatternIds;
  readonly patterns: readonly HeatmapPattern[];
  readonly rows: readonly HeatmapRowGeometry[];
  readonly size: number;
  readonly title: string;
  readonly titleId: string;
  readonly width: number;
};
