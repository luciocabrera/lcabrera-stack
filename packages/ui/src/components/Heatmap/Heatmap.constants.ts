import type { ChartTone } from '#ui/components/LineChart/LineChart.types';

import type { HeatmapPattern } from './Heatmap.types';

export const HEATMAP = {
  cellAttribute: 'data-heatmap-cell',
  cellGap: 1,
  defaultCellSize: 16,
  gridRole: 'grid',
  missingValue: 'No value',
  pageRows: 10,
  patternSize: 6,
  swatchSize: 12,
} as const;

export const HEATMAP_DEFAULT_TONE = 'neutral' satisfies ChartTone;

export const HEATMAP_PATTERNS: readonly HeatmapPattern[] = ['dots', 'hatch'];

export const HEATMAP_TONE_SCALE = { kind: 'tone' } as const;
