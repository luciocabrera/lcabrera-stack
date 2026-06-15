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
import { useSetTableIsColumnSettingsPinned } from '@/components/Table/contexts/TableConfig/meta/actions';
import { useGetTableIsColumnSettingsPinned } from '@/components/Table/contexts/TableConfig/meta/selectors';
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
  isBussy = false,
}: ColumnSettingsDrawerProps<TData>) => {
  useRenderTracker({ componentName: `ColumnSettingsDrawer:${columnKey}` });

  const column = useGetNormalizedColumn<TData>(columnKey);
  const isPinned = useGetTableIsColumnSettingsPinned();
  const setIsPinned = useSetTableIsColumnSettingsPinned();
  const wrapperRef = useTableWrapperRef();

  const batchSetColumnDrawerSettings = useBatchSetColumnDrawerSettings();
  const resetAllColumnDrawerSettings = useResetAllColumnDrawerSettings();

  const isFilterable = column.isFilterable !== false;
  const isSortable = column.isSortable !== false;
  const isStatic = column.isStatic === true;

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
    ...(isStatic
      ? []
      : [
          {
            children: <PinningSection columnKey={columnKey} />,
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
    if (isBussy) {
      return;
    }

    batchSetColumnDrawerSettings();
  };

  const handleCancel = () => {
    if (isBussy) {
      return;
    }

    resetAllColumnDrawerSettings(!isPinned);
  };

  const handleTogglePin = () => {
    if (isBussy) {
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
            isBussy={isBussy}
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
        <Tabs isBussy={isBussy} tabs={tabs} />
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
