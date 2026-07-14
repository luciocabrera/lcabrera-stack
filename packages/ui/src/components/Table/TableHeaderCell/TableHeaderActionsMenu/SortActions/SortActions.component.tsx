import type { SortActionsProps } from './SortActions.types';

import { ClearSortingButton } from './ClearSortingButton/ClearSortingButton.component';
import { SortAscendingButton } from './SortAscendingButton/SortAscendingButton.component';
import { SortDescendingButton } from './SortDescendingButton/SortDescendingButton.component';

/**
 * Sorting section of the column header actions menu — a thin shell composing
 * the ascending, descending, and clear-sorting delegates. Each delegate owns
 * its own `useSetColumnSorting` wiring; this shell only forwards `columnKey`,
 * `onClose`, and the current `sortDirection`.
 */
export const SortActions = <TData,>({
  columnKey,
  onClose,
  sortDirection,
}: SortActionsProps<TData>) => (
  <>
    <SortAscendingButton
      columnKey={columnKey}
      onClose={onClose}
      sortDirection={sortDirection}
    />
    <SortDescendingButton
      columnKey={columnKey}
      onClose={onClose}
      sortDirection={sortDirection}
    />
    <ClearSortingButton
      columnKey={columnKey}
      onClose={onClose}
      sortDirection={sortDirection}
    />
  </>
);
