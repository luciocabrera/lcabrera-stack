import { useEffect, useMemo, useState } from 'react';

import type { TabItem } from '@/components/Tabs';

import { Button } from '@/components/Button';
import {
  MenuCloseIcon,
  PinIcon,
  PinOffIcon,
  SettingsIcon,
} from '@/components/Icons';
import {
  SidePanel,
  SidePanelBody,
  SidePanelFooter,
  SidePanelHeader,
  SidePanelTitle,
} from '@/components/SidePanel';
import {
  useGetColumnFilters,
  useGetColumnOrder,
  useGetColumns,
  useGetColumnSizing,
  useGetColumnsSorting,
  useGetColumnVisibility,
} from '@/components/Table/TableContext/hooks/store/columns/selectors';
import { Tabs } from '@/components/Tabs';

import type { BatchTableSettingsUpdate } from '../Table/TableContext';
import type { TableSettingsDrawerProps } from './TableSettingsDrawer.types';

import { useBatchSetTableSettings } from '../Table/TableContext/hooks/store/columns/actions';
import { ColumnOrderSection } from './ColumnOrderSection';
import { FiltersSection } from './FiltersSection';
import { validateFilter } from './FiltersSection/FilterEditor';
import { GeneralSettingsSection } from './GeneralSettingsSection';
import { SortingSection } from './SortingSection';

export const TableSettingsDrawer = ({
  isOpen,
  isPinned,
  onClose,
  onPinChange,
}: TableSettingsDrawerProps) => {
  // Subscribe to table state from context

  const columns = useGetColumns();
  const columnSizing = useGetColumnSizing();
  const columnsOrder = useGetColumnOrder();
  const columnVisibility = useGetColumnVisibility();
  const columnFilters = useGetColumnFilters();
  const columnsSorting = useGetColumnsSorting();

  const batchSetTableSettings = useBatchSetTableSettings() as (
    settings: BatchTableSettingsUpdate,
  ) => void;

  const [pendingColumnFilters, setPendingColumnFilters] =
    useState(columnFilters);
  const [pendingSorting, setPendingSorting] = useState(columnsSorting);
  const [pendingColumnOrder, setPendingColumnOrder] = useState(columnsOrder);
  const [pendingColumnSizing, setPendingColumnSizing] = useState(columnSizing);
  const [pendingColumnVisibility, setPendingColumnVisibility] =
    useState(columnVisibility);

  // Update pending state when initialPendingState changes (when drawer opens with new values)
  useEffect(() => {
    setPendingColumnFilters(columnFilters);
    setPendingSorting(columnsSorting);
    setPendingColumnOrder(columnsOrder);
    setPendingColumnSizing(columnSizing);
    setPendingColumnVisibility(columnVisibility);
  }, [columnFilters, columnsSorting, columnsOrder, columnSizing, columnVisibility]);

  // Validate all filters before allowing accept
  const areFiltersValid = useMemo(() => {
    return Object.values(pendingColumnFilters).every((filter) =>
      validateFilter(filter),
    );
  }, [pendingColumnFilters]);

  const handleAccept = () => {
    if (!areFiltersValid) {
      // Don't allow accept if filters are invalid
      return;
    }

    console.log('[handleAccept] pendingSorting:', pendingSorting);
    console.log('[handleAccept] pendingColumnFilters:', pendingColumnFilters);

    // Batch update all store state at once
    // This prevents race conditions where intermediate updates trigger
    // the sync effect and overwrite pending values with stale store values
    batchSetTableSettings({
      columnFilters: pendingColumnFilters,
      columnOrder: pendingColumnOrder,
      columnSizing: pendingColumnSizing,
      columnVisibility: pendingColumnVisibility,
      sorting: pendingSorting,
    });

    console.log('[handleAccept] After batchSetTableSettings');

    // Unpin if pinned, then close
    if (isPinned) {
      onPinChange?.(false);
    }
    onClose();
  };

  const handleCancel = () => {
    // Reset to original values
    setPendingColumnFilters(columnFilters);
    setPendingSorting(columnsSorting);
    setPendingColumnOrder(columnsOrder);
    setPendingColumnSizing(columnSizing);
    setPendingColumnVisibility(columnVisibility);
    // Unpin if pinned, then close
    if (isPinned) onPinChange?.(false);

    onClose();
  };

  const handleTogglePin = () => {
    onPinChange?.(!isPinned);
  };

  const tabs: TabItem[] = [
    {
      children: (
        <GeneralSettingsSection
          onColumnSizingChange={setPendingColumnSizing}
        />
      ),
      header: 'General',
      key: 'general',
    },
    {
      children: (
        <SortingSection
          onSortChange={setPendingSorting}
          sorting={pendingSorting}
        />
      ),
      header: (() => {
        const sortCount = pendingSorting.length;
        return sortCount > 0 ? `Sorting (${sortCount})` : 'Sorting';
      })(),
      key: 'sorting',
    },
    {
      children: (
        <FiltersSection
          filters={pendingColumnFilters}
          onFiltersChange={setPendingColumnFilters}
        />
      ),
      header: (() => {
        const filterCount = Object.keys(pendingColumnFilters).length;
        return filterCount > 0 ? `Filters (${filterCount})` : 'Filters';
      })(),
      key: 'filters',
    },
    {
      children: (
        <ColumnOrderSection
          columnOrder={pendingColumnOrder}
          columnVisibility={pendingColumnVisibility}
          onColumnOrderChange={setPendingColumnOrder}
          onColumnVisibilityChange={setPendingColumnVisibility}
        />
      ),
      header: (() => {
        // columnVisibility contains hidden columns, so visible = total - hidden
        const visibleCount = columns.length - pendingColumnVisibility.size;
        return `Columns (${visibleCount}/${columns.length})`;
      })(),
      key: 'columns',
    },
  ];

  return (
    <SidePanel
      isOpen={isOpen}
      isPinned={isPinned}
      onClose={handleCancel}
      position='right'
      size='md'
    >
      <SidePanelHeader
        actions={
          <>
            {onPinChange && (
              <Button
                aria-label={isPinned ? 'Unpin drawer' : 'Pin drawer'}
                color='ghost'
                icon={
                  isPinned ? <PinIcon size={16} /> : <PinOffIcon size={16} />
                }
                onClick={handleTogglePin}
                size='mini'
                title={isPinned ? 'Unpin drawer' : 'Pin drawer'}
              />
            )}
            <Button
              aria-label='Close drawer'
              color='ghost'
              icon={<MenuCloseIcon size={16} />}
              onClick={handleCancel}
              size='mini'
              title='Close'
            />
          </>
        }
      >
        <SidePanelTitle icon={<SettingsIcon size={20} />}>
          Table Settings
        </SidePanelTitle>
      </SidePanelHeader>
      <SidePanelBody>
        <Tabs tabs={tabs} />
      </SidePanelBody>
      <SidePanelFooter>
        <Button
          color='primary'
          isDisabled={!areFiltersValid}
          onClick={handleAccept}
          size='sm'
          title={
            areFiltersValid
              ? undefined
              : 'Please fix invalid filters before accepting'
          }
        >
          Accept
        </Button>
        <Button color='outline' onClick={handleCancel} size='sm'>
          Cancel
        </Button>
      </SidePanelFooter>
    </SidePanel>
  );
};
