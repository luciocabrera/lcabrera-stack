import type { BreadcrumbHandle } from '@lcabrera/ui';
import type { HeatmapLegendItem } from '@lcabrera/ui/components/Heatmap';

export const EVALS_HEATMAP_HANDLE = {
  breadcrumb: () => [{ label: 'Evals', to: '/evals' }, { label: 'heatmap' }],
} satisfies BreadcrumbHandle;

export const HEAT_TONES = {
  high: 'success',
  low: 'error',
  mid: 'warning',
  none: 'neutral',
} as const;

export const HEATMAP_LEGEND = [
  { label: '90% or more', tone: 'success' },
  { label: '50% or more', tone: 'warning' },
  { label: 'Below 50%', tone: 'error' },
  { label: 'No scored trials', tone: 'neutral' },
  { label: 'Holds a flaky task', pattern: 'hatch' },
] as const satisfies readonly HeatmapLegendItem[];
