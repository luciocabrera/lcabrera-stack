import type { BreadcrumbHandle } from '@lcabrera/ui';

export const EVALS_SUBJECT_TREND_HANDLE = {
  breadcrumb: ({ params }) => [
    { label: 'Evals', to: '/evals' },
    { label: `${params.kind ?? ''} trend` },
  ],
} satisfies BreadcrumbHandle;
