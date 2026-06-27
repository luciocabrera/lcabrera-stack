import type { TabItem } from '@/components/Tabs';

import { Button } from '@/components/Button';
import { SettingsIcon } from '@/components/Icons';
import {
  SidePanel,
  SidePanelBody,
  SidePanelFooter,
  SidePanelHeader,
  SidePanelHeaderToolbar,
  SidePanelTitle,
} from '@/components/SidePanel';
import { Tabs } from '@/components/Tabs';
import { useNotifyAction } from '@/contexts/NotificationContext/actions';
import { ICON_SIZE_LG } from '@/design-system/constants';

import type { TableSettingsDrawerProps } from './TableSettingsDrawer.types';

import {
  useSetTableIsTableSettingsOpen,
  useSetTableIsTableSettingsPinned,
  useSetTableSettingsSelectedTab,
} from '../contexts/TableConfig/meta/actions';
import {
  useGetTableIsTableSettingsPinned,
  useGetTableSettingsSelectedTab,
} from '../contexts/TableConfig/meta/selectors';
import { ColumnOrderSection } from './ColumnOrderSection';
import { ColumnOrderSectionProvider } from './ColumnOrderSection/ColumnOrderSectionContext/ColumnOrderSectionContext.provider';
import { DetailsSection } from './DetailsSection';
import { FiltersSection } from './FiltersSection';
import { isFilterValid } from './FiltersSection/isFilterValid.util';
import { GeneralSettingsSection } from './GeneralSettingsSection';
import { SortingSection } from './SortingSection';
import {
  useBatchSetTableDrawerSettings,
  useResetTableSettings,
} from './TableDrawerContext/actions';
import { useGetColumnFilters } from './TableDrawerContext/selectors';

export const TableSettingsDrawer = ({
  isBusy = false,
}: TableSettingsDrawerProps) => {
  const batchSetTableDrawerSettings = useBatchSetTableDrawerSettings();
  const notify = useNotifyAction();
  const resetTableDrawerSettings = useResetTableSettings();
  const isPinned = useGetTableIsTableSettingsPinned();
  const selectedTab = useGetTableSettingsSelectedTab();
  const setSelectedTab = useSetTableSettingsSelectedTab();
  const setTableIsTableSettingsOpen = useSetTableIsTableSettingsOpen();
  const setTableIsTableSettingsPinned = useSetTableIsTableSettingsPinned();

  const filters = useGetColumnFilters();
  const areFiltersValid = Object.values(filters).every((f) => isFilterValid(f));
  const closeIfUnpinned = () => {
    if (!isPinned) {
      setTableIsTableSettingsOpen(false);
    }
  };

  const handleAccept = () => {
    if (isBusy) {
      return;
    }

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
    closeIfUnpinned();
  };

  const handleCancel = () => {
    if (isBusy) {
      return;
    }

    resetTableDrawerSettings();
    closeIfUnpinned();
  };

  const handleTogglePin = () => {
    if (isBusy) {
      return;
    }

    setTableIsTableSettingsPinned(!isPinned);
  };

  const tabs: TabItem[] = [
    {
      children: <GeneralSettingsSection isBusy={isBusy} />,
      header: 'General',
      key: 'general',
    },

    {
      children: <FiltersSection isBusy={isBusy} />,
      header: 'Filters',
      key: 'filters',
    },
    {
      children: <SortingSection isBusy={isBusy} />,
      header: 'Sorting',
      key: 'sorting',
    },

    {
      children: <ColumnOrderSection isBusy={isBusy} />,
      header: 'Columns',
      key: 'columns',
    },
    {
      children: <DetailsSection isBusy={isBusy} />,
      header: 'Details',
      key: 'details',
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
          <SidePanelHeaderToolbar
            isBusy={isBusy}
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
        <ColumnOrderSectionProvider>
          <Tabs
            isBusy={isBusy}
            onSelectTab={setSelectedTab}
            selectedTab={selectedTab}
            tabs={tabs}
          />
        </ColumnOrderSectionProvider>
      </SidePanelBody>
      <SidePanelFooter>
        <Button
          color='primary'
          isBusy={isBusy}
          onClick={handleAccept}
          size='sm'
        >
          Accept
        </Button>
        <Button
          color='outline'
          isBusy={isBusy}
          onClick={handleCancel}
          size='sm'
        >
          Cancel
        </Button>
      </SidePanelFooter>
    </SidePanel>
  );
};
