import type { BreadcrumbHandle } from '@lcabrera/ui';

export const EVALS_QUALITY_HANDLE = {
  breadcrumb: () => [{ label: 'Evals', to: '/evals' }, { label: 'quality' }],
} satisfies BreadcrumbHandle;

export const QUALITY_SUITE = 'skill-quality';

export const QUALITY_TOP_SCORE = 5;

export const QUALITY_SPARKLINE = { height: 48, width: 240 } as const;
