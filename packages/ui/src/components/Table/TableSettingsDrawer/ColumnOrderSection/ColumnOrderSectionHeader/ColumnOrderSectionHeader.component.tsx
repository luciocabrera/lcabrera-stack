import { SidePanelSectionHeader } from '@repo/ui/components/SidePanel';
import { useGetColumns } from '@repo/ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook';
import { useGetColumnVisibility } from '@repo/ui/components/Table/TableSettingsDrawer/TableDrawerContext/selectors';

import type { ColumnOrderSectionHeaderProps } from './ColumnOrderSectionHeader.types';

import { ColumnOrderSectionToolbar } from '../ColumnOrderSectionToolbar';
import { filterSettingsColumns } from '../utils';

/**
 * Header of the column order section: the visible/total column count title
 * plus the compact order/clear/reset toolbar. Reads the column and
 * visibility stores itself to derive the counts.
 */
export const ColumnOrderSectionHeader = ({
  isBusy = false,
}: ColumnOrderSectionHeaderProps) => {
  const columns = useGetColumns();
  const columnVisibility = useGetColumnVisibility();

  const settingsColumns = filterSettingsColumns(columns);
  const visibleCount = settingsColumns.length - columnVisibility.size;

  return (
    <SidePanelSectionHeader
      title={`Column Order & Visibility (${visibleCount}/${settingsColumns.length})`}
      toolbar={<ColumnOrderSectionToolbar isBusy={isBusy} variant='toolbar' />}
    />
  );
};
