import type { BreadcrumbHandle } from '@lcabrera/ui';
import type { TableColumn } from '@lcabrera/ui/components/Table';

import type { FlakyTaskRow } from './EvalsFlaky.types';

export const EVALS_FLAKY_HANDLE = {
  breadcrumb: () => [{ label: 'Evals', to: '/evals' }, { label: 'flaky' }],
} satisfies BreadcrumbHandle;

export const FLAKY_TASK_COLUMNS: readonly TableColumn<FlakyTaskRow>[] = [
  { key: 'taskKey', label: 'Task' },
  {
    align: 'end',
    key: 'disagreeing',
    label: 'Split runs',
    render: ({ disagreeing, runs }) =>
      `${String(disagreeing)} of ${String(runs)}`,
  },
];
