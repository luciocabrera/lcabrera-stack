import { useGetTableGroupingKeys } from '#ui/components/Table/contexts/TableConfig/grouping/selectors';
import { useGetTableDataError } from '#ui/components/Table/contexts/TableData/data/selectors';

import { TableEmptyStateClearGroupingButton } from './TableEmptyStateClearGroupingButton/TableEmptyStateClearGroupingButton.component';
import { TableEmptyStateRetryButton } from './TableEmptyStateRetryButton/TableEmptyStateRetryButton.component';

/**
 * A grouping the endpoint refused is a property of the request rather than of a moment:
 * revalidating sends the same keys and is refused again, so the offer is the one edit that
 * resolves it — dropping the grouping.
 * Choosing between two delegates rather than branching inside one keeps the grouping write
 * path **unmounted** unless a refusal is on screen.
 */
export const TableEmptyStateAction = () => {
  const error = useGetTableDataError();
  const groupingKeys = useGetTableGroupingKeys();

  // Guarded on the applied keys as well as the refusal: with nothing grouped
  // there is nothing to clear, and offering it would be an action that changes
  // nothing.
  const isGroupingRefused =
    error?.kind === 'grouping-refused' && groupingKeys.length > 0;

  if (isGroupingRefused) return <TableEmptyStateClearGroupingButton />;

  return <TableEmptyStateRetryButton />;
};
