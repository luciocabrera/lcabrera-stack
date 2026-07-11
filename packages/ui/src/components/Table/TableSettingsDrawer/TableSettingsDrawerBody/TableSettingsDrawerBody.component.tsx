import type { TabItem } from '@repo/ui/components/Tabs';

import { SidePanelBody } from '@repo/ui/components/SidePanel';
import { useSetTableSettingsSelectedTab } from '@repo/ui/components/Table/contexts/TableConfig/meta/actions';
import { useGetTableSettingsSelectedTab } from '@repo/ui/components/Table/contexts/TableConfig/meta/selectors';
import { Tabs } from '@repo/ui/components/Tabs';

import type { TableSettingsDrawerBodyProps } from './TableSettingsDrawerBody.types';

import { ColumnOrderSection } from '../ColumnOrderSection';
import { ColumnOrderSectionProvider } from '../ColumnOrderSection/ColumnOrderSectionContext/ColumnOrderSectionContext.provider';
import { DetailsSection } from '../DetailsSection';
import { FiltersSection } from '../FiltersSection';
import { GeneralSettingsSection } from '../GeneralSettingsSection';
import { SortingSection } from '../SortingSection';

/**
 * Body of the table settings drawer: the tabbed section container. Builds
 * the General/Filters/Sorting/Columns/Details tab set and wires the selected
 * tab through the table meta store so it survives drawer re-opens.
 */
export const TableSettingsDrawerBody = ({
  isBusy = false,
}: TableSettingsDrawerBodyProps) => {
  const selectedTab = useGetTableSettingsSelectedTab();
  const setSelectedTab = useSetTableSettingsSelectedTab();

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
