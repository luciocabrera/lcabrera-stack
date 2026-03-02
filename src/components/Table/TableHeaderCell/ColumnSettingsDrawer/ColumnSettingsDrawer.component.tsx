import { useState } from 'react';

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
import { useGetNormalizedColumn } from '@/components/Table/contexts/TableConfig/columns/selectors';
import { useTableWrapperRef } from '@/components/Table/contexts/TableWrapper';
import { Tabs } from '@/components/Tabs';
import { useRenderTracker } from '@/utils/performance';

import type { ColumnSettingsDrawerProps } from './ColumnSettingsDrawer.types';

import {
  useBatchSetColumnDrawerSettings,
  useResetColumnSettings,
} from './ColumnDrawerContext/hooks/store/columns/actions';
import { DetailsSection } from './DetailsSection';
import { FilterSection } from './FilterSection';
import { GeneralSection } from './GeneralSection';
import { SortingSection } from './SortingSection';

export const ColumnSettingsDrawer = <TData,>({
  columnKey,
  isOpen,
  onClose,
}: ColumnSettingsDrawerProps<TData>) => {
  useRenderTracker({ componentName: `ColumnSettingsDrawer:${columnKey}` });

  const column = useGetNormalizedColumn<TData>(columnKey);
  const wrapperRef = useTableWrapperRef();

  const batchSetColumnDrawerSettings = useBatchSetColumnDrawerSettings();
  const resetColumnDrawerSettings = useResetColumnSettings();

  const [isPinned, setIsPinned] = useState(false);
  const pinButtonTitle = isPinned ? 'Unpin drawer' : 'Pin drawer';

  const handleAccept = () => {
    // if (!areFiltersValid) {
    //   // Don't allow accept if filters are invalid
    //   return;
    // }

    batchSetColumnDrawerSettings();

    // Unpin if pinned, then close
    if (isPinned) {
      setIsPinned(false);
    }
    onClose();
  };

  const handleCancel = () => {
    resetColumnDrawerSettings();
    // Unpin if pinned, then close
    if (isPinned) setIsPinned(false);

    onClose();
  };

  const handleTogglePin = () => {
    setIsPinned(!isPinned);
  };

  const handleClearAll = () => {
    //
    // Reset sizing draft back to original, then batch commit
    resetColumnDrawerSettings();

    onClose();
  };

  const isFilterable = column.isFilterable !== false;
  const isSortable = column.isSortable !== false;

  const tabs: TabItem[] = [
    {
      children: <GeneralSection columnKey={columnKey} />,
      header: 'General',
      key: 'general',
    },
    {
      children: <DetailsSection columnKey={columnKey} />,
      header: 'Details',
      key: 'details',
    },
    ...(isFilterable && column.dataType
      ? [
          {
            children: <FilterSection columnKey={columnKey} />,
            header: 'Filter',
            key: 'filter',
          },
        ]
      : []),
    ...(isSortable
      ? [
          {
            children: <SortingSection columnKey={columnKey} />,
            header: 'Sorting',
            key: 'sorting',
          },
        ]
      : []),
  ];

  return (
    <SidePanel
      isOpen={isOpen}
      isPinned={isPinned}
      onClose={handleCancel}
      portalContainer={wrapperRef}
      position='right'
      size='md'
    >
      <SidePanelHeader
        actions={
          <>
            <Button
              aria-label={pinButtonTitle}
              color='ghost'
              icon={isPinned ? <PinIcon size={16} /> : <PinOffIcon size={16} />}
              onClick={handleTogglePin}
              size='mini'
              title={pinButtonTitle}
            />
            <Button
              aria-label='Close column drawer'
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
          {column.label}
        </SidePanelTitle>
      </SidePanelHeader>
      <SidePanelBody>
        <Tabs tabs={tabs} />
      </SidePanelBody>
      <SidePanelFooter>
        <Button color='primary' onClick={handleAccept} size='sm'>
          Accept
        </Button>
        <Button color='outline' onClick={handleClearAll} size='sm'>
          Clear All
        </Button>
        <Button color='outline' onClick={handleCancel} size='sm'>
          Cancel
        </Button>
      </SidePanelFooter>
    </SidePanel>
  );
};
