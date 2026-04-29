import { useState } from 'react';

import type { TabItem } from '@/components/Tabs';

import { Button } from '@/components/Button';
import { SettingsIcon } from '@/components/Icons';
import { NotificationCenter } from '@/components/NotificationCenter';
import {
  SidePanel,
  SidePanelBody,
  SidePanelFooter,
  SidePanelHeader,
  SidePanelHeaderToolbar,
  SidePanelTitle,
} from '@/components/SidePanel';
import { Tabs } from '@/components/Tabs';
import { ICON_SIZE_LG } from '@/design-system/constants';
import { useNotifications } from '@/hooks/useNotifications.hook';

import { useToogleTableIsTableSettingsOpen } from '../contexts/TableConfig/meta/actions';
import { ColumnOrderSection } from './ColumnOrderSection';
import { ColumnOrderSectionProvider } from './ColumnOrderSection/ColumnOrderSectionContext/ColumnOrderSectionContext.provider';
import { FiltersSection } from './FiltersSection';
import { validateFilter } from './FiltersSection/validateFilter.util';
import { GeneralSettingsSection } from './GeneralSettingsSection';
import { SortingSection } from './SortingSection';
import {
  useBatchSetTableDrawerSettings,
  useResetTableSettings,
} from './TableDrawerContext/actions';
import { useGetColumnFilters } from './TableDrawerContext/selectors';

export const TableSettingsDrawer = () => {
  const batchSetTableDrawerSettings = useBatchSetTableDrawerSettings();
  const { notify } = useNotifications();
  const resetTableDrawerSettings = useResetTableSettings();
  const toogleTableIsTableSettingsOpen = useToogleTableIsTableSettingsOpen();

  const [isPinned, setIsPinned] = useState(false);

  const filters = useGetColumnFilters();
  const areFiltersValid = Object.values(filters).every((f) =>
    validateFilter(f),
  );
  const handleAccept = () => {
    if (!areFiltersValid) {
      notify({
        message: 'Fix invalid filters before accepting table settings.',
        placement: 'bottom-right',
        title: 'Invalid filters',
        variant: 'warning',
      });
      return;
    }

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
      <NotificationCenter />
      <SidePanelHeader
        actions={
          <SidePanelHeaderToolbar
            isPinned={isPinned}
            onClose={handleCancel}
            onTogglePin={handleTogglePin}
          />
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
