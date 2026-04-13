import { TableSettingsDrawer } from '@/components/Table/TableSettingsDrawer';
import { TableDrawerProvider } from '@/components/Table/TableSettingsDrawer/TableDrawerContext/TableDrawerContext.provider';
import { useRenderTracker } from '@/utils/performance';

import { ColumnSettingsDrawer } from '../ColumnSettingsDrawer/index.ts';
import { ColumnDrawerProvider } from '../ColumnSettingsDrawer/ColumnDrawerContext/ColumnDrawerContext.provider.tsx';
import {
  useGetTableColumnSelectedKey,
  useGetTableIsColumnSettingsOpen,
  useGetTableIsTableSettingsOpen,
} from '../contexts/TableConfig/meta/selectors/index.ts';

export const TableDrawersSection = () => {
  useRenderTracker({ componentName: 'TableDrawersSection' });

  const isColumnSettingsOpen = useGetTableIsColumnSettingsOpen();
  const isTableSettingsOpen = useGetTableIsTableSettingsOpen();
  const columnKey = useGetTableColumnSelectedKey();

  if (isTableSettingsOpen)
    return (
      <TableDrawerProvider>
        <TableSettingsDrawer />
      </TableDrawerProvider>
    );
  if (isColumnSettingsOpen && columnKey)
    return (
      <ColumnDrawerProvider columnKey={columnKey}>
        <ColumnSettingsDrawer columnKey={columnKey} />
      </ColumnDrawerProvider>
    );
  return <></>;
};
