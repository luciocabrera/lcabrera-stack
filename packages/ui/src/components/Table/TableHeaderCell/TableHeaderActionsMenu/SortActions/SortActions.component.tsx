import type { SortActionsProps } from './SortActions.types';

import { ClearSortingButton } from './ClearSortingButton/ClearSortingButton.component';
import { SortAscendingButton } from './SortAscendingButton/SortAscendingButton.component';
import { SortDescendingButton } from './SortDescendingButton/SortDescendingButton.component';

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
