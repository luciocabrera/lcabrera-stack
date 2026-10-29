import { use } from 'react';

import { useGetTableGroupingKeys } from '#ui/components/Table/contexts/TableConfig/grouping/selectors';
import { TablePersistenceContext } from '#ui/components/Table/contexts/TableConfig/TablePersistenceContext.context';
import { useGetTableDataError } from '#ui/components/Table/contexts/TableData/data/selectors';

import { TableEmptyStateClearGroupingButton } from './TableEmptyStateClearGroupingButton/TableEmptyStateClearGroupingButton.component';
import { TableEmptyStateRetryButton } from './TableEmptyStateRetryButton/TableEmptyStateRetryButton.component';

export const TableEmptyStateAction = () => {
  const error = useGetTableDataError();
  const groupingKeys = useGetTableGroupingKeys();
  const hasRouteData = use(TablePersistenceContext) !== undefined;

  const isGroupingRefused =
    error?.kind === 'grouping-refused' && groupingKeys.length > 0;

  return isGroupingRefused ? (
    <TableEmptyStateClearGroupingButton />
  ) : (
    hasRouteData && <TableEmptyStateRetryButton />
  );
};
