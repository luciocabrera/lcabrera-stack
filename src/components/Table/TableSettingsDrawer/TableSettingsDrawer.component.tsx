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
import { Tabs } from '@/components/Tabs';
import { ICON_SIZE_LG, ICON_SIZE_MD } from '@/design-system/constants';

import { useToogleTableIsTableSettingsOpen } from '../contexts/TableConfig/meta/actions';
import { ColumnOrderSection } from './ColumnOrderSection';
import { ColumnOrderSectionProvider } from './ColumnOrderSection/ColumnOrderSectionContext/ColumnOrderSectionContext.provider';
import { FiltersSection } from './FiltersSection';
import { GeneralSettingsSection } from './GeneralSettingsSection';
import { SortingSection } from './SortingSection';
import {
  useBatchSetTableDrawerSettings,
  useResetTableSettings,
} from './TableDrawerContext/actions';

export const TableSettingsDrawer = () => {
  const batchSetTableDrawerSettings = useBatchSetTableDrawerSettings();
  const resetTableDrawerSettings = useResetTableSettings();
  const toogleTableIsTableSettingsOpen = useToogleTableIsTableSettingsOpen();

  const [isPinned, setIsPinned] = useState(false);

  const areFiltersValid = true; // TODO: implement filter validation
  const pinButtonTitle = isPinned ? 'Unpin drawer' : 'Pin drawer';

  const acceptButtonTitle = 'Please fix invalid filters before accepting';

  const handleAccept = () => {
    // if (!areFiltersValid) {
    //   // Don't allow accept if filters are invalid
    //   return;
    // }

    batchSetTableDrawerSettings();

    // Unpin if pinned, then close
    if (isPinned) {
      setIsPinned(false);
    }
  };

  const handleCancel = () => {
    resetTableDrawerSettings();
    // Unpin if pinned, then close
    if (isPinned) setIsPinned(false);

    toogleTableIsTableSettingsOpen();
  };

  const handleTogglePin = () => {
    setIsPinned(!isPinned);
  };

  const tabs: TabItem[] = [
    {
      children: <GeneralSettingsSection />,
      header: 'General',
      key: 'general',
    },
    {
      children: <FiltersSection />,
      header: 'Filters',
      key: 'filters',
    },
    {
      children: <SortingSection />,
      header: ' Sorting',
      key: 'sorting',
    },

    {
      children: (
        <ColumnOrderSectionProvider>
          <ColumnOrderSection />
        </ColumnOrderSectionProvider>
      ),
      header: 'Columns',
      key: 'columns',
    },
  ];

  return (
    <SidePanel
      isOpen={true}
      isPinned={isPinned}
      onClose={handleCancel}
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
              aria-label='Close drawer'
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
          title={acceptButtonTitle}
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
