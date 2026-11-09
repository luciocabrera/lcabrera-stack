import type {
  HeatmapCell,
  HeatmapLegendItem,
} from '#ui/components/Heatmap/Heatmap.types';

import { HEATMAP_PATTERNS } from '#ui/components/Heatmap/Heatmap.constants';

type GetUsedPatternsArgs = {
  readonly cells: readonly HeatmapCell[];
  readonly legend: readonly HeatmapLegendItem[] | undefined;
};

export const getUsedPatterns = ({ cells, legend = [] }: GetUsedPatternsArgs) =>
  HEATMAP_PATTERNS.filter((name) =>
    [...cells, ...legend].some(({ pattern }) => pattern === name),
  );
