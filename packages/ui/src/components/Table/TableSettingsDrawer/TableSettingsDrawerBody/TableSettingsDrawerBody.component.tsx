import type { TabItem } from '#ui/components/Tabs';

import { SidePanelBody } from '#ui/components/SidePanel';
import { useSetTableSettingsSelectedTab } from '#ui/components/Table/contexts/TableConfig/meta/actions';
import {
  useGetTableIsGroupingEnabled,
  useGetTableSettingsSelectedTab,
} from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import { Tabs } from '#ui/components/Tabs';

import type { TableSettingsDrawerBodyProps } from './TableSettingsDrawerBody.types';

import { ColumnOrderSection } from '../ColumnOrderSection';
import { ColumnOrderSectionProvider } from '../ColumnOrderSection/ColumnOrderSectionContext/ColumnOrderSectionContext.provider';
import { DetailsSection } from '../DetailsSection';
import { FiltersSection } from '../FiltersSection';
import { GeneralSettingsSection } from '../GeneralSettingsSection';
import { GroupingSection } from '../GroupingSection';
import { SortingSection } from '../SortingSection';

/**
 * Body of the table settings drawer: the tabbed section container. Builds the
 * General/Filters/Sorting/Grouping/Columns/Details tab set and wires the
 * selected tab through the table meta store so it survives drawer re-opens.
 *
 * The Grouping tab appears only where the route declared the capability
 * (ADR-063). A table whose endpoint cannot group would otherwise offer a
 * control whose every use is refused; absent means off, as everywhere else.
 */
export const TableSettingsDrawerBody = ({
  isBusy = false,
}: TableSettingsDrawerBodyProps) => {
  const selectedTab = useGetTableSettingsSelectedTab();
  const setSelectedTab = useSetTableSettingsSelectedTab();
  const isGroupingEnabled = useGetTableIsGroupingEnabled();

  const groupingTabs: TabItem[] = isGroupingEnabled
    ? [
        {
          children: <GroupingSection isBusy={isBusy} />,
          header: 'Grouping',
          key: 'grouping',
        },
      ]
    : [];

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
    ...groupingTabs,
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
