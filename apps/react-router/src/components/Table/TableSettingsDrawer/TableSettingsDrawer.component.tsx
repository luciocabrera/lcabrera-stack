import type { TabItem } from '@/components/Tabs';
import type { TableSettingsDrawerProps } from './TableSettingsDrawer.types';

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
import { ICON_SIZE_LG } from '@/design-system/constants';
import { useNotifications } from '@/hooks/useNotifications.hook';

import {
  useSetTableSettingsSelectedTab,
  useSetTableIsTableSettingsOpen,
  useSetTableIsTableSettingsPinned,
} from '../contexts/TableConfig/meta/actions';
import {
  useGetTableIsTableSettingsPinned,
  useGetTableSettingsSelectedTab,
} from '../contexts/TableConfig/meta/selectors';
import { ColumnOrderSection } from './ColumnOrderSection';
import { ColumnOrderSectionProvider } from './ColumnOrderSection/ColumnOrderSectionContext/ColumnOrderSectionContext.provider';
import { DetailsSection } from './DetailsSection';
import { FiltersSection } from './FiltersSection';
import { validateFilter } from './FiltersSection/validateFilter.util';
import { GeneralSettingsSection } from './GeneralSettingsSection';
import { SortingSection } from './SortingSection';
import {
  useBatchSetTableDrawerSettings,
  useResetTableSettings,
} from './TableDrawerContext/actions';
import { useGetColumnFilters } from './TableDrawerContext/selectors';

export const TableSettingsDrawer = ({
  isBussy = false,
}: TableSettingsDrawerProps) => {
  const batchSetTableDrawerSettings = useBatchSetTableDrawerSettings();
  const { notify } = useNotifications();
  const resetTableDrawerSettings = useResetTableSettings();
  const isPinned = useGetTableIsTableSettingsPinned();
  const selectedTab = useGetTableSettingsSelectedTab();
  const setSelectedTab = useSetTableSettingsSelectedTab();
  const setTableIsTableSettingsOpen = useSetTableIsTableSettingsOpen();
  const setTableIsTableSettingsPinned = useSetTableIsTableSettingsPinned();

  const filters = useGetColumnFilters();
  const areFiltersValid = Object.values(filters).every((f) =>
    validateFilter(f),
  );
  const closeIfUnpinned = () => {
    if (!isPinned) {
      setTableIsTableSettingsOpen(false);
    }
  };

  const handleAccept = () => {
    if (isBussy) {
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
    if (isBussy) {
      return;
    }

    resetTableDrawerSettings();
    closeIfUnpinned();
  };

  const handleTogglePin = () => {
    if (isBussy) {
      return;
    }

    setTableIsTableSettingsPinned(!isPinned);
  };

  const tabs: TabItem[] = [
    {
      children: <GeneralSettingsSection isBussy={isBussy} />,
      header: 'General',
      key: 'general',
    },

    {
      children: <FiltersSection isBussy={isBussy} />,
      header: 'Filters',
      key: 'filters',
    },
    {
      children: <SortingSection isBussy={isBussy} />,
      header: 'Sorting',
      key: 'sorting',
    },

    {
      children: <ColumnOrderSection isBussy={isBussy} />,
      header: 'Columns',
      key: 'columns',
    },
    {
      children: <DetailsSection isBussy={isBussy} />,
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
            isBussy={isBussy}
            onSelectTab={setSelectedTab}
            selectedTab={selectedTab}
            tabs={tabs}
          />
        </ColumnOrderSectionProvider>
      </SidePanelBody>
      <SidePanelFooter>
        <Button
          color='primary'
          isBussy={isBussy}
          onClick={handleAccept}
          size='sm'
        >
          Accept
        </Button>
        <Button
          color='outline'
          isBussy={isBussy}
          onClick={handleCancel}
          size='sm'
        >
          Cancel
        </Button>
      </SidePanelFooter>
    </SidePanel>
  );
};
