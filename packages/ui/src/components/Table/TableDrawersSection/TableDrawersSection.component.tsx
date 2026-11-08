import { use } from 'react';

import { TableSettingsDrawer } from '#ui/components/Table/TableSettingsDrawer';
import { TableDrawerProvider } from '#ui/components/Table/TableSettingsDrawer/TableDrawerContext/TableDrawerContext.provider';

import { ColumnSettingsDrawer } from '../ColumnSettingsDrawer';
import { ColumnDrawerProvider } from '../ColumnSettingsDrawer/ColumnDrawerContext/ColumnDrawerContext.provider';
import {
  useGetTableColumnSelectedKey,
  useGetTableDrawersSyncNonce,
  useGetTableIsColumnSettingsOpen,
  useGetTableIsTableSettingsOpen,
} from '../contexts/TableConfig/meta/selectors';
import { TablePresentationContext } from '../contexts/TableConfig/TablePresentationContext.context';

export const TableDrawersSection = () => {
  const isColumnSettingsOpen = useGetTableIsColumnSettingsOpen();
  const isTableSettingsOpen = useGetTableIsTableSettingsOpen();
  const columnKey = useGetTableColumnSelectedKey();
  const drawersSyncNonce = useGetTableDrawersSyncNonce();
  const { features } = use(TablePresentationContext);

  if (!features.settings) return;

  if (isColumnSettingsOpen && columnKey)
    return (
      <ColumnDrawerProvider key={`${columnKey}-${drawersSyncNonce}`}>
        <ColumnSettingsDrawer />
      </ColumnDrawerProvider>
    );
  if (isTableSettingsOpen)
    return (
      <TableDrawerProvider key={`table-${drawersSyncNonce}`}>
        <TableSettingsDrawer />
      </TableDrawerProvider>
    );
};
