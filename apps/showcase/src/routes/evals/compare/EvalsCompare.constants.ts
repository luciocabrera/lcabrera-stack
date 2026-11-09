import type { BreadcrumbHandle } from '@lcabrera/ui';
import type { TableColumn } from '@lcabrera/ui/components/Table';

import type { CompareTotal } from './EvalsCompare.types';

export const EVALS_COMPARE_HANDLE = {
  breadcrumb: () => [{ label: 'Evals', to: '/evals' }, { label: 'compare' }],
} satisfies BreadcrumbHandle;

export const TOTAL_COLUMNS: readonly TableColumn<CompareTotal>[] = [
  { key: 'metric', label: 'Total' },
  { align: 'end', key: 'a', label: 'A' },
  { align: 'end', key: 'b', label: 'B' },
  { align: 'end', key: 'change', label: 'Change' },
];

export const PREFILLED_CHOICE = { a: 1, b: 0 } as const;
