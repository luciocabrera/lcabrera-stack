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

import type { TableSettingsDrawerProps } from './TableSettingsDrawer.types';

import {
  useBulkSetColumnSizing,
  useColumnFilters,
  useColumnOrder,
  useColumnSizing,
  useColumnVisibility,
  useSetColumnFilters,
  useSetColumnOrder,
  useSetColumnVisibility,
  useSetSorting,
  useSorting,
} from '../Table/TableContext';
import { ColumnOrderSection } from './ColumnOrderSection';
import { FiltersSection } from './FiltersSection';
import { validateFilter } from './FiltersSection/FilterEditor';
import { GeneralSettingsSection } from './GeneralSettingsSection';
import { SortingSection } from './SortingSection';

export const TableSettingsDrawer = ({
  columns,
  isOpen,
  isPinned,
  onClose,
  onPinChange,
}: TableSettingsDrawerProps) => {
  // Subscribe to table state from context
  const [columnFilters] = useColumnFilters();
  const [columnOrder] = useColumnOrder();
  const [columnSizing] = useColumnSizing();
  const [columnVisibility] = useColumnVisibility();
  const [sorting] = useSorting();

  // Get setters
  const setColumnFilters = useSetColumnFilters();
  const setColumnOrder = useSetColumnOrder();
  const setColumnVisibility = useSetColumnVisibility();
  const setSorting = useSetSorting();
  const setColumnSizing = useBulkSetColumnSizing();

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
    console.log('ACCEPTING SETTINGS:', {
      pendingColumnFilters,
      pendingColumnOrder,
      pendingColumnSizing,
      pendingColumnVisibility,
      pendingSorting,
    });
    if (!areFiltersValid) {
      // Don't allow accept if filters are invalid
      return;
    }
    setColumnFilters(pendingColumnFilters);
    setSorting(pendingSorting);
    setColumnOrder(pendingColumnOrder);
    setColumnSizing(pendingColumnSizing);
    setColumnVisibility(pendingColumnVisibility);
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
    console.log('cancelling SETTINGS:', {
      columnFilters,
      columnOrder,
      columnSizing,
      columnVisibility,
      sorting,
    });
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
