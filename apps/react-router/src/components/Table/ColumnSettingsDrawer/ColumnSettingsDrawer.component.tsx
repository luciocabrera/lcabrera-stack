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
import { useGetNormalizedColumn } from '@/components/Table/contexts/TableConfig/columns/selectors';
import {
  useSetTableColumnSettingsSelectedTab,
  useSetTableIsColumnSettingsPinned,
} from '@/components/Table/contexts/TableConfig/meta/actions';
import {
  useGetTableColumnSettingsSelectedTab,
  useGetTableIsColumnSettingsPinned,
} from '@/components/Table/contexts/TableConfig/meta/selectors';
import { useTableWrapperRef } from '@/components/Table/contexts/TableWrapper';
import { Tabs } from '@/components/Tabs';
import { ICON_SIZE_LG } from '@/design-system/constants';
import { useRenderTracker } from '@/utils/performance';

import type { ColumnSettingsDrawerProps } from './ColumnSettingsDrawer.types';

import {
  useBatchSetColumnDrawerSettings,
  useResetAllColumnDrawerSettings,
} from './ColumnDrawerContext/actions';
import { DetailsSection } from './DetailsSection';
import { FilterSection } from './FilterSection';
import { GeneralSection } from './GeneralSection';
import { PinningSection } from './PinningSection';
import { SortingSection } from './SortingSection';

export const ColumnSettingsDrawer = <TData extends Record<string, unknown>>({
  columnKey,
  isBusy = false,
}: ColumnSettingsDrawerProps<TData>) => {
  useRenderTracker({ componentName: `ColumnSettingsDrawer:${columnKey}` });

  const column = useGetNormalizedColumn<TData>(columnKey);
  const isPinned = useGetTableIsColumnSettingsPinned();
  const selectedTab = useGetTableColumnSettingsSelectedTab();
  const setIsPinned = useSetTableIsColumnSettingsPinned();
  const setSelectedTab = useSetTableColumnSettingsSelectedTab();
  const wrapperRef = useTableWrapperRef();

  const batchSetColumnDrawerSettings = useBatchSetColumnDrawerSettings();
  const resetAllColumnDrawerSettings = useResetAllColumnDrawerSettings();

  const isFilterable = column.isFilterable !== false;
  const isSortable = column.isSortable !== false;
  const isStatic = column.isStatic === true;

  const tabs: TabItem[] = [
    {
      children: <GeneralSection columnKey={columnKey} isBusy={isBusy} />,
      header: 'General',
      key: 'general',
    },
    ...(isFilterable && column.dataType
      ? [
          {
            children: <FilterSection columnKey={columnKey} isBusy={isBusy} />,
            header: 'Filter',
            key: 'filter',
          },
        ]
      : []),
    ...(isSortable
      ? [
          {
            children: <SortingSection isBusy={isBusy} />,
            header: 'Sorting',
            key: 'sorting',
          },
        ]
      : []),
    ...(isStatic
      ? []
      : [
          {
            children: <PinningSection columnKey={columnKey} isBusy={isBusy} />,
            header: 'Pinning',
            key: 'pinning',
          },
        ]),
    {
      children: <DetailsSection columnKey={columnKey} />,
      header: 'Details',
      key: 'details',
    },
  ];

  const handleAccept = () => {
    if (isBusy) {
      return;
    }

    batchSetColumnDrawerSettings();
  };

  const handleCancel = () => {
    if (isBusy) {
      return;
    }

    resetAllColumnDrawerSettings(!isPinned);
  };

  const handleTogglePin = () => {
    if (isBusy) {
      return;
    }

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
          <SidePanelHeaderToolbar
            isBusy={isBusy}
            isPinned={isPinned}
            onClose={handleCancel}
            onTogglePin={handleTogglePin}
          />
        }
      >
        <SidePanelTitle icon={<SettingsIcon size={ICON_SIZE_LG} />}>
          {column.label}
        </SidePanelTitle>
      </SidePanelHeader>
      <SidePanelBody>
        <Tabs
          isBusy={isBusy}
          onSelectTab={setSelectedTab}
          selectedTab={selectedTab}
          tabs={tabs}
        />
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
