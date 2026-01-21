import { useEffect, useMemo, useState } from 'react';

import type { TabItem } from '@/components/Tabs';

import { Button } from '@/components/Button';
import { PinIcon, PinOffIcon, SettingsIcon } from '@/components/Icons';
import {
  SidePanel,
  SidePanelBody,
  SidePanelFooter,
  SidePanelHeader,
  SidePanelTitle,
} from '@/components/SidePanel';
import { Tabs } from '@/components/Tabs';

import type { TableSettingsDrawerProps } from './TableSettingsDrawer.types';

import { ColumnOrderSection } from './ColumnOrderSection';
import { FiltersSection } from './FiltersSection';
import { validateFilter } from './FiltersSection/FilterEditor';
import { GeneralSettingsSection } from './GeneralSettingsSection';
import { SortingSection } from './SortingSection';

export const TableSettingsDrawer = ({
  columnFilters,
  columnOrder,
  columns,
  columnSizing,
  columnVisibility,
  isOpen,
  isPinned,
  onClose,
  onColumnFiltersChange,
  onColumnOrderChange,
  onColumnSizingChange,
  onColumnVisibilityChange,
  onPinChange,
  onSortingChange,
  sorting,
}: TableSettingsDrawerProps) => {
  // Local state for pending changes - reset when drawer opens
  const initialPendingState = useMemo(
    () => ({
      columnFilters,
      columnOrder,
      columnSizing,
      columnVisibility,
      sorting,
    }),
    // Only reset when drawer opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isOpen],
  );

  const [pendingColumnFilters, setPendingColumnFilters] = useState(
    initialPendingState.columnFilters,
  );
  const [pendingSorting, setPendingSorting] = useState(
    initialPendingState.sorting,
  );
  const [pendingColumnOrder, setPendingColumnOrder] = useState(
    initialPendingState.columnOrder,
  );
  const [pendingColumnSizing, setPendingColumnSizing] = useState(
    initialPendingState.columnSizing,
  );
  const [pendingColumnVisibility, setPendingColumnVisibility] = useState(
    initialPendingState.columnVisibility,
  );

  // Update pending state when initialPendingState changes (when drawer opens with new values)
  useEffect(() => {
    setPendingColumnFilters(initialPendingState.columnFilters);
    setPendingSorting(initialPendingState.sorting);
    setPendingColumnOrder(initialPendingState.columnOrder);
    setPendingColumnSizing(initialPendingState.columnSizing);
    setPendingColumnVisibility(initialPendingState.columnVisibility);
  }, [initialPendingState]);

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
    onColumnFiltersChange(pendingColumnFilters);
    onSortingChange(pendingSorting);
    onColumnOrderChange(pendingColumnOrder);
    onColumnSizingChange(pendingColumnSizing);
    onColumnVisibilityChange(pendingColumnVisibility);
    onClose();
  };

  const handleCancel = () => {
    // Reset to original values
    setPendingColumnFilters(columnFilters);
    setPendingSorting(sorting);
    setPendingColumnOrder(columnOrder);
    setPendingColumnSizing(columnSizing);
    setPendingColumnVisibility(columnVisibility);
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
      header: 'Sorting',
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
      header: 'Columns',
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
          onPinChange && (
            <Button
              aria-label={isPinned ? 'Unpin drawer' : 'Pin drawer'}
              color='ghost'
              icon={isPinned ? <PinIcon size={16} /> : <PinOffIcon size={16} />}
              onClick={handleTogglePin}
              size='mini'
              title={isPinned ? 'Unpin drawer' : 'Pin drawer'}
            />
          )
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
