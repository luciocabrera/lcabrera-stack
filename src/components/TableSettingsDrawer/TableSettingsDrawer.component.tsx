import { useEffect, useMemo, useState } from 'react';

import type { TabItem } from '@/components/Tabs';

import { Button } from '@/components/Button';
import { SettingsIcon } from '@/components/Icons';
import {
  SidePanel,
  SidePanelBody,
  SidePanelFooter,
  SidePanelHeader,
  SidePanelTitle,
} from '@/components/SidePanel';
import { Tabs } from '@/components/Tabs';

import type { TableSettingsDrawerProps } from './TableSettingsDrawer.types';

import { ColumnOrderSection } from './components/ColumnOrderSection';
import { SortingSection } from './components/SortingSection';

export const TableSettingsDrawer = ({
  columnOrder,
  columns,
  columnVisibility,
  isOpen,
  isPinned,
  onClose,
  onColumnOrderChange,
  onColumnVisibilityChange,
  onPinChange,
  onSortingChange,
  sorting,
}: TableSettingsDrawerProps) => {
  // Local state for pending changes - reset when drawer opens
  const initialPendingState = useMemo(
    () => ({
      columnOrder,
      columnVisibility,
      sorting,
    }),
    // Only reset when drawer opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isOpen],
  );

  const [pendingSorting, setPendingSorting] = useState(initialPendingState.sorting);
  const [pendingColumnOrder, setPendingColumnOrder] = useState(initialPendingState.columnOrder);
  const [pendingColumnVisibility, setPendingColumnVisibility] = useState(
    initialPendingState.columnVisibility,
  );

  // Update pending state when initialPendingState changes (when drawer opens with new values)
  useEffect(() => {
    setPendingSorting(initialPendingState.sorting);
    setPendingColumnOrder(initialPendingState.columnOrder);
    setPendingColumnVisibility(initialPendingState.columnVisibility);
  }, [initialPendingState]);

  const handleAccept = () => {
    onSortingChange(pendingSorting);
    onColumnOrderChange(pendingColumnOrder);
    onColumnVisibilityChange(pendingColumnVisibility);
    onClose();
  };

  const handleCancel = () => {
    // Reset to original values
    setPendingSorting(sorting);
    setPendingColumnOrder(columnOrder);
    setPendingColumnVisibility(columnVisibility);
    onClose();
  };

  const tabs: TabItem[] = [
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
      onPinChange={onPinChange}
      position='right'
      size='md'
    >
      <SidePanelHeader>
        <SidePanelTitle icon={<SettingsIcon size={20} />}>
          Table Settings
        </SidePanelTitle>
      </SidePanelHeader>
      <SidePanelBody>
        <Tabs tabs={tabs} />
      </SidePanelBody>
      <SidePanelFooter>
        <Button color='ghost' onClick={handleCancel}>
          Cancel
        </Button>
        <Button color='primary' onClick={handleAccept}>
          Accept
        </Button>
      </SidePanelFooter>
    </SidePanel>
  );
};
