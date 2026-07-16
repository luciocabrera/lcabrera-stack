import type { TabItem } from '@repo/ui/components/Tabs';

import { SidePanelBody } from '@repo/ui/components/SidePanel';
import { useGetNormalizedColumn } from '@repo/ui/components/Table/contexts/TableConfig/columns/selectors';
import { useSetTableColumnSettingsSelectedTab } from '@repo/ui/components/Table/contexts/TableConfig/meta/actions';
import {
  useGetTableColumnSelectedKey,
  useGetTableColumnSettingsSelectedTab,
} from '@repo/ui/components/Table/contexts/TableConfig/meta/selectors';
import {
  useGetTableIsLoading,
  useGetTableIsLoadingMore,
} from '@repo/ui/components/Table/contexts/TableData/data/selectors';
import { Tabs } from '@repo/ui/components/Tabs';

import { DetailsSection } from '../DetailsSection';
import { FilterSection } from '../FilterSection';
import { GeneralSection } from '../GeneralSection';
import { PinningSection } from '../PinningSection';
import { SortingSection } from '../SortingSection';

/**
 * Body of the column settings drawer: the tabbed section container. Builds
 * the tab set from the column's capabilities (Filter only for filterable
 * columns with a data type, Sorting only for sortable columns, Pinning only
 * for movable columns) and wires the selected tab through the table meta
 * store so it survives drawer re-opens.
 */
export const ColumnSettingsDrawerBody = <
  TData extends Record<string, unknown>,
>() => {
  const isLoading = useGetTableIsLoading();
  const isLoadingMore = useGetTableIsLoadingMore();
  const columnKey = useGetTableColumnSelectedKey<TData>();
  const isBusy = isLoading || isLoadingMore;
  const column = useGetNormalizedColumn<TData>(columnKey);
  const selectedTab = useGetTableColumnSettingsSelectedTab();
  const setSelectedTab = useSetTableColumnSettingsSelectedTab();

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
            children: <PinningSection isBusy={isBusy} />,
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

  return (
    <SidePanelBody>
      <Tabs
        isBusy={isBusy}
        onSelectTab={setSelectedTab}
        selectedTab={selectedTab}
        tabs={tabs}
      />
    </SidePanelBody>
  );
};
