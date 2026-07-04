import { TableSettingsDrawer } from '@repo/ui/components/Table/TableSettingsDrawer';
import { TableDrawerProvider } from '@repo/ui/components/Table/TableSettingsDrawer/TableDrawerContext/TableDrawerContext.provider';

import { ColumnSettingsDrawer } from '../ColumnSettingsDrawer';
import { ColumnDrawerProvider } from '../ColumnSettingsDrawer/ColumnDrawerContext/ColumnDrawerContext.provider';
import {
  useGetTableColumnSelectedKey,
  useGetTableDrawersSyncNonce,
  useGetTableIsColumnSettingsOpen,
  useGetTableIsTableSettingsOpen,
} from '../contexts/TableConfig/meta/selectors';
import {
  useGetTableIsLoading,
  useGetTableIsLoadingMore,
} from '../contexts/TableData/data/selectors';

export const TableDrawersSection = () => {
  const isColumnSettingsOpen = useGetTableIsColumnSettingsOpen();
  const isLoading = useGetTableIsLoading();
  const isLoadingMore = useGetTableIsLoadingMore();
  const isTableSettingsOpen = useGetTableIsTableSettingsOpen();
  const columnKey = useGetTableColumnSelectedKey();
  const drawersSyncNonce = useGetTableDrawersSyncNonce();
  const isBusy = isLoading || isLoadingMore;

  if (isColumnSettingsOpen && columnKey)
    return (
      <ColumnDrawerProvider
        columnKey={columnKey}
        key={`${columnKey}-${drawersSyncNonce}`}
      >
        <ColumnSettingsDrawer columnKey={columnKey} isBusy={isBusy} />
      </ColumnDrawerProvider>
    );
  if (isTableSettingsOpen)
    return (
      <TableDrawerProvider key={`table-${drawersSyncNonce}`}>
        <TableSettingsDrawer isBusy={isBusy} />
      </TableDrawerProvider>
    );
  return <></>;
};
