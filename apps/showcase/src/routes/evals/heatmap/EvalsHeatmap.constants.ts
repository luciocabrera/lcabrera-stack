import type { BreadcrumbHandle } from '@lcabrera/ui';

export const EVALS_HEATMAP_HANDLE = {
  breadcrumb: () => [{ label: 'Evals', to: '/evals' }, { label: 'heatmap' }],
} satisfies BreadcrumbHandle;
