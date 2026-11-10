import type { BreadcrumbHandle } from '@lcabrera/ui';

export const EVALS_CONFUSION_HANDLE = {
  breadcrumb: () => [{ label: 'Evals', to: '/evals' }, { label: 'confusion' }],
} satisfies BreadcrumbHandle;

export const CONFUSION_SUITE = 'skills';

export const NO_SKILL = '(none)';

export const ERRORED = '(error)';

export const EMPTY_CELL = '·';

export const CORNER = String.raw`Expected \ loaded`;
