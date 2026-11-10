import type { BreadcrumbHandle } from '@lcabrera/ui';

export const EVALS_SUBJECT_TREND_HANDLE = {
  breadcrumb: ({ params }) => [
    { label: 'Evals', to: '/evals' },
    { label: `${params.kind ?? ''} trend` },
  ],
} satisfies BreadcrumbHandle;

export const MARK_TONES = {
  annotation: 'warning',
  content: 'info',
  model: 'secondary',
} as const;
