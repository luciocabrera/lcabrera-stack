import { SidePanelSectionHeader } from '#ui/components/SidePanel';
import { useGetColumns } from '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook';

import type { ColumnOrderSectionHeaderProps } from './ColumnOrderSectionHeader.types';

import { ColumnOrderSectionToolbar } from '../ColumnOrderSectionToolbar';
import { useGetRenderedColumnKeys } from '../hooks';
import { filterSettingsColumns } from '../utils';

export const ColumnOrderSectionHeader = ({
  isBusy = false,
}: ColumnOrderSectionHeaderProps) => {
  const columns = useGetColumns();
  const renderedColumnKeys = useGetRenderedColumnKeys();

  const rendered = new Set(renderedColumnKeys);
  const settingsColumns = filterSettingsColumns(columns);
  const visibleCount = settingsColumns.filter((column) =>
    rendered.has(String(column.key)),
  ).length;

  return (
    <SidePanelSectionHeader
      title={`Column Order & Visibility (${visibleCount}/${settingsColumns.length})`}
      toolbar={<ColumnOrderSectionToolbar isBusy={isBusy} variant='toolbar' />}
    />
  );
};
