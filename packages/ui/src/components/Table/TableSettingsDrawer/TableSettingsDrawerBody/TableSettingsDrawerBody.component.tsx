import type { TabItem } from '#ui/components/Tabs';

import { SidePanelBody } from '#ui/components/SidePanel';
import { useSetTableSettingsSelectedTab } from '#ui/components/Table/contexts/TableConfig/meta/actions';
import {
  useGetTableIsGroupingEnabled,
  useGetTableSettingsSelectedTab,
  useGetTableSettingsTabOrder,
} from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import { orderSettingsTabs } from '#ui/components/Table/utils/orderSettingsTabs.util';
import { resolveSettingsTabOrder } from '#ui/components/Table/utils/resolveSettingsTabOrder.util';
import { Tabs } from '#ui/components/Tabs';

import type { TableSettingsDrawerBodyProps } from './TableSettingsDrawerBody.types';

import { AdvancedSettingsSection } from '../AdvancedSettingsSection';
import { ColumnOrderSection } from '../ColumnOrderSection';
import { ColumnOrderSectionProvider } from '../ColumnOrderSection/ColumnOrderSectionContext/ColumnOrderSectionContext.provider';
import { DetailsSection } from '../DetailsSection';
import { FiltersSection } from '../FiltersSection';
import { GeneralSettingsSection } from '../GeneralSettingsSection';
import { GroupingSection } from '../GroupingSection';
import { SortingSection } from '../SortingSection';

export const TableSettingsDrawerBody = ({
  isBusy = false,
}: TableSettingsDrawerBodyProps) => {
  const selectedTab = useGetTableSettingsSelectedTab();
  const setSelectedTab = useSetTableSettingsSelectedTab();
  const isGroupingEnabled = useGetTableIsGroupingEnabled();
  const tabOrder = useGetTableSettingsTabOrder();

  const groupingTabs: TabItem[] = isGroupingEnabled
    ? [
        {
          children: <GroupingSection isBusy={isBusy} />,
          header: 'Grouping',
          key: 'grouping',
        },
      ]
    : [];

  const advancedTabs: TabItem[] = isGroupingEnabled
    ? [
        {
          children: <AdvancedSettingsSection isBusy={isBusy} />,
          header: 'Advanced',
          key: 'advanced',
        },
      ]
    : [];

  const tabs: TabItem[] = orderSettingsTabs({
    order: resolveSettingsTabOrder(tabOrder),
    tabs: [
      {
        children: <GeneralSettingsSection isBusy={isBusy} />,
        header: 'General',
        key: 'general',
      },
      {
        children: <ColumnOrderSection isBusy={isBusy} />,
        header: 'Columns',
        key: 'columns',
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
      ...groupingTabs,
      {
        children: <DetailsSection isBusy={isBusy} />,
        header: 'Details',
        key: 'details',
      },
      ...advancedTabs,
    ],
  });

  return (
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
  );
};
