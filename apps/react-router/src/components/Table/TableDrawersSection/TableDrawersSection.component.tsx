import { TableSettingsDrawer } from '@/components/Table/TableSettingsDrawer';
import { TableDrawerProvider } from '@/components/Table/TableSettingsDrawer/TableDrawerContext/TableDrawerContext.provider';
import { useRenderTracker } from '@/utils/performance';

import { ColumnSettingsDrawer } from '../ColumnSettingsDrawer';
import { ColumnDrawerProvider } from '../ColumnSettingsDrawer/ColumnDrawerContext/ColumnDrawerContext.provider';
import {
  useGetTableColumnSelectedKey,
  useGetTableIsColumnSettingsOpen,
  useGetTableIsColumnSettingsPinned,
  useGetTableIsTableSettingsPinned,
  useGetTableIsTableSettingsOpen,
} from '../contexts/TableConfig/meta/selectors';
import {
  useGetTableIsLoading,
  useGetTableIsLoadingMore,
} from '../contexts/TableData/data/selectors';

export const TableDrawersSection = () => {
  useRenderTracker({ componentName: 'TableDrawersSection' });

  const isColumnSettingsOpen = useGetTableIsColumnSettingsOpen();
  const isColumnSettingsPinned = useGetTableIsColumnSettingsPinned();
  const isLoading = useGetTableIsLoading();
  const isLoadingMore = useGetTableIsLoadingMore();
  const isTableSettingsPinned = useGetTableIsTableSettingsPinned();
  const isTableSettingsOpen = useGetTableIsTableSettingsOpen();
  const columnKey = useGetTableColumnSelectedKey();
  const isColumnSettingsBusy =
    isLoadingMore || (isLoading && isColumnSettingsPinned);
  const isTableSettingsBusy =
    isLoadingMore || (isLoading && isTableSettingsPinned);

  if (isColumnSettingsOpen && columnKey)
    return (
      <ColumnDrawerProvider columnKey={columnKey}>
        <ColumnSettingsDrawer
          columnKey={columnKey}
          isBusy={isColumnSettingsBusy}
        />
      </ColumnDrawerProvider>
    );
  if (isTableSettingsOpen)
    return (
      <TableDrawerProvider>
        <TableSettingsDrawer isBusy={isTableSettingsBusy} />
      </TableDrawerProvider>
    );
  return <></>;
};
