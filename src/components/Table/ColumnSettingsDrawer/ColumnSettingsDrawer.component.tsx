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
import { ICON_SIZE_LG, ICON_SIZE_MD } from '@/design-system/constants';
import { useRenderTracker } from '@/utils/performance';

import type { ColumnSettingsDrawerProps } from './ColumnSettingsDrawer.types';

import {
  useBatchSetColumnDrawerSettings,
  useResetToTableState,
} from './ColumnDrawerContext/actions';
import { DetailsSection } from './DetailsSection';
import { FilterSection } from './FilterSection';
import { GeneralSection } from './GeneralSection';
import { PinningSection } from './PinningSection';
import { SortingSection } from './SortingSection';

export const ColumnSettingsDrawer = ({
  columnKey,
}: ColumnSettingsDrawerProps) => {
  useRenderTracker({ componentName: `ColumnSettingsDrawer:${columnKey}` });

  const column = useGetNormalizedColumn<unknown>(columnKey);
  const wrapperRef = useTableWrapperRef();

  const batchSetColumnDrawerSettings = useBatchSetColumnDrawerSettings();
  const resetToTableState = useResetToTableState();

  const [isPinned, setIsPinned] = useState(false);

  const pinButtonTitle = isPinned ? 'Unpin drawer' : 'Pin drawer';
  const isFilterable = column.isFilterable !== false;
  const isSortable = column.isSortable !== false;

  const tabs: TabItem[] = [
    {
      children: <GeneralSection columnKey={columnKey} />,
      header: 'General',
      key: 'general',
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
            children: <SortingSection />,
            header: 'Sorting',
            key: 'sorting',
          },
        ]
      : []),
    {
      children: <PinningSection columnKey={columnKey} />,
      header: 'Pinning',
      key: 'pinning',
    },
    {
      children: <DetailsSection columnKey={columnKey} />,
      header: 'Details',
      key: 'details',
    },
  ];

  const handleAccept = () => {
    batchSetColumnDrawerSettings();

    if (isPinned) setIsPinned(false);
  };

  const handleCancel = () => {
    resetToTableState();

    if (isPinned) setIsPinned(false);
  };

  const handleTogglePin = () => {
    setIsPinned(!isPinned);
  };

  return (
    <SidePanel
      isOpen={true}
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
              icon={
                isPinned ? (
                  <PinIcon size={ICON_SIZE_MD} />
                ) : (
                  <PinOffIcon size={ICON_SIZE_MD} />
                )
              }
              onClick={handleTogglePin}
              size='mini'
              title={pinButtonTitle}
            />
            <Button
              aria-label='Close column drawer'
              color='ghost'
              icon={<MenuCloseIcon size={ICON_SIZE_MD} />}
              onClick={handleCancel}
              size='mini'
              title='Close'
            />
          </>
        }
      >
        <SidePanelTitle icon={<SettingsIcon size={ICON_SIZE_LG} />}>
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
        <Button color='outline' onClick={handleCancel} size='sm'>
          Cancel
        </Button>
      </SidePanelFooter>
    </SidePanel>
  );
};
