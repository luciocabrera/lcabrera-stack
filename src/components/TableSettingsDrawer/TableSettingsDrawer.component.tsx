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
import { Tabs } from '@/components/Tabs';

import type { BatchTableSettingsUpdate } from '../Table/TableContext';
import type { TableSettingsDrawerProps } from './TableSettingsDrawer.types';

import {
  useBatchSetTableSettings,
  useColumnFilters,
  useColumnOrder,
  useColumnSizing,
  useColumnVisibility,
  useIsImperativeUpdateRef,
  useSorting,
} from '../Table/TableContext';
import { useColumns } from '../Table/TableContext/hooks/selectors.hooks';
import { ColumnOrderSection } from './ColumnOrderSection';
import { FiltersSection } from './FiltersSection';
import { validateFilter } from './FiltersSection/FilterEditor';
import { GeneralSettingsSection } from './GeneralSettingsSection';
import { SortingSection } from './SortingSection';

export const TableSettingsDrawer = ({
  // columns,
  isOpen,
  isPinned,
  onClose,
  onPinChange,
  // onUpdateURLState,
}: TableSettingsDrawerProps) => {
  // Subscribe to table state from context

  const [columns] = useColumns();
  const [columnFilters] = useColumnFilters();
  const [columnOrder] = useColumnOrder();
  const [columnSizing] = useColumnSizing();
  const [columnVisibility] = useColumnVisibility();
  const [sorting] = useSorting();

  // Ref to signal that drawer is doing an imperative update
  // This tells effects to skip their URL sync
  const isImperativeUpdateRef = useIsImperativeUpdateRef();

  // Get batch setter for all table settings at once
  // This prevents race conditions when updating multiple settings

  const batchSetTableSettings = useBatchSetTableSettings() as (
    settings: BatchTableSettingsUpdate,
  ) => void;

  // Local state for pending changes - reset when drawer opens
  // const initialPendingState = useMemo(
  //   () => ({
  //     columnFilters,
  //     columnOrder,
  //     columnSizing,
  //     columnVisibility,
  //     sorting,
  //   }),
  //   // Only reset when drawer opens
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  //   [isOpen],
  // );

  const [pendingColumnFilters, setPendingColumnFilters] =
    useState(columnFilters);
  const [pendingSorting, setPendingSorting] = useState(sorting);
  const [pendingColumnOrder, setPendingColumnOrder] = useState(columnOrder);
  const [pendingColumnSizing, setPendingColumnSizing] = useState(columnSizing);
  const [pendingColumnVisibility, setPendingColumnVisibility] =
    useState(columnVisibility);

  // Update pending state when initialPendingState changes (when drawer opens with new values)
  useEffect(() => {
    setPendingColumnFilters(columnFilters);
    setPendingSorting(sorting);
    setPendingColumnOrder(columnOrder);
    setPendingColumnSizing(columnSizing);
    setPendingColumnVisibility(columnVisibility);
  }, [columnFilters, sorting, columnOrder, columnSizing, columnVisibility]);

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

    // Set flag to tell effects to skip their URL sync
    // We're handling URL update directly via onUpdateURLState
    isImperativeUpdateRef.current = true;

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

    // Imperatively update URL with new state
    // This avoids effect-based sync which can cause circular updates
    // onUpdateURLState?.({
    //   columnFilters: pendingColumnFilters,
    //   columnOrder: pendingColumnOrder,
    //   columnVisibility: pendingColumnVisibility,
    //   sorting: pendingSorting,
    // });

    console.log('[handleAccept] After onUpdateURLState');

    // Clear the flag after a microtask to allow navigation to complete
    // This ensures effects that run immediately after see the flag as true
    queueMicrotask(() => {
      isImperativeUpdateRef.current = false;
    });

    // Unpin if pinned, then close
    if (isPinned) {
      onPinChange?.(false);
    }
    onClose();
  };

  // const handleReinitialize = () => {
  //   setPendingColumnFilters(columnFilters);
  //   setPendingSorting(sorting);
  //   setPendingColumnOrder(columnOrder);
  //   setPendingColumnSizing(columnSizing);
  //   setPendingColumnVisibility(columnVisibility);
  // };

  const handleCancel = () => {
    // Reset to original values
    setPendingColumnFilters(columnFilters);
    setPendingSorting(sorting);
    setPendingColumnOrder(columnOrder);
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
          columns={columns}
          onColumnSizingChange={setPendingColumnSizing}
        />
      ),
      header: 'General',
      key: 'general',
    },
    {
      children: (
        <SortingSection
          columns={columns}
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
          columns={columns}
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
          columns={columns}
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
