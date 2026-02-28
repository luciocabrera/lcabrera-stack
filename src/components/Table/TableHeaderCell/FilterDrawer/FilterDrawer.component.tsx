import { useEffect, useRef, useState } from 'react';

import type { TabItem } from '@/components/Tabs';
import type { SortDirection } from '@/types/ui.types';

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
import {
  useResetColumnFilter,
  useSetColumnFilter,
  useSetColumnSorting,
} from '@/components/Table/contexts/TableConfig/columns/actions';
import {
  useGetNormalizedColumn,
  useGetNormalizedColumnFilters,
} from '@/components/Table/contexts/TableConfig/columns/selectors';
import { useTableWrapperRef } from '@/components/Table/contexts/TableWrapper';
import { Tabs } from '@/components/Tabs';
import { useRenderTracker } from '@/utils/performance';

import type { FilterDrawerProps } from './FilterDrawer.types';

import { DetailsSection } from './DetailsSection';
import { FilterSection } from './FilterSection';
import { SortingSection } from './SortingSection';

export const FilterDrawer = <TData,>({
  columnKey,
  isOpen,
  onClose,
}: FilterDrawerProps<TData>) => {
  useRenderTracker({ componentName: `FilterDrawer:${columnKey}` });

  const column = useGetNormalizedColumn<TData>(columnKey);
  const filter = useGetNormalizedColumnFilters<TData>(columnKey);
  const wrapperRef = useTableWrapperRef();

  const resetColumnFilter = useResetColumnFilter();
  const setColumnFilter = useSetColumnFilter();
  const setColumnSorting = useSetColumnSorting();

  // Local draft state for filter (applied on Accept)
  const [localFilter, setLocalFilter] = useState<typeof filter | undefined>(
    filter,
  );

  // Local draft state for sorting (applied on Accept)
  const [localSortDirection, setLocalSortDirection] = useState<SortDirection>(
    column.sortDirection,
  );

  const [isPinned, setIsPinned] = useState(false);
  const pinButtonTitle = isPinned ? 'Unpin drawer' : 'Pin drawer';

  // Ref to capture committed values when the drawer opens (for cancel/discard)
  const filterOnOpenRef = useRef(filter);
  const sortOnOpenRef = useRef(column.sortDirection);

  // Sync local state when drawer opens
  useEffect(() => {
    if (isOpen) {
      filterOnOpenRef.current = filter;
      sortOnOpenRef.current = column.sortDirection;
      setLocalFilter(filter);
      setLocalSortDirection(column.sortDirection);
    }
    // Only react to isOpen transitions — values are captured at open time
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleAccept = () => {
    setColumnFilter({ columnKey: column.key, filter: localFilter });
    setColumnSorting({ columnKey, direction: localSortDirection });
    if (isPinned) setIsPinned(false);
    onClose();
  };

  const handleCancel = () => {
    // Discard draft changes
    setLocalFilter(filterOnOpenRef.current);
    setLocalSortDirection(sortOnOpenRef.current);
    if (isPinned) setIsPinned(false);
    onClose();
  };

  const handleTogglePin = () => {
    setIsPinned(!isPinned);
  };

  const handleClearAll = () => {
    setLocalFilter(undefined);
    resetColumnFilter(column.key);
    setColumnSorting({ columnKey, direction: undefined });
    onClose();
  };

  const isFilterable = column.isFilterable !== false;
  const isSortable = column.isSortable !== false;

  const tabs: TabItem[] = [
    {
      children: <DetailsSection columnKey={columnKey} />,
      header: 'Details',
      key: 'details',
    },
    ...(isFilterable && column.dataType
      ? [
          {
            children: (
              <FilterSection
                columnKey={columnKey}
                filter={localFilter}
                onChange={setLocalFilter}
              />
            ),
            header: 'Filter',
            key: 'filter',
          },
        ]
      : []),
    ...(isSortable
      ? [
          {
            children: (
              <SortingSection
                columnKey={columnKey}
                onChange={setLocalSortDirection}
                sortDirection={localSortDirection}
              />
            ),
            header: 'Sorting',
            key: 'sorting',
          },
        ]
      : []),
  ];

  return (
    <SidePanel
      isOpen={isOpen}
      isPinned={isPinned}
      onClose={handleCancel}
      portalContainer={wrapperRef}
      position='right'
      size='md'
    >
      <SidePanelHeader
        actions={
          <>
            <Button
              aria-label={pinButtonTitle}
              color='ghost'
              icon={isPinned ? <PinIcon size={16} /> : <PinOffIcon size={16} />}
              onClick={handleTogglePin}
              size='mini'
              title={pinButtonTitle}
            />
            <Button
              aria-label='Close column drawer'
              color='ghost'
              icon={<MenuCloseIcon size={16} />}
              onClick={handleCancel}
              size='mini'
              title='Close'
            />
          </>
        }
      >
        <SidePanelTitle icon={<SettingsIcon size={20} />}>
          {column.label}
        </SidePanelTitle>
      </SidePanelHeader>
      <SidePanelBody>
        <Tabs tabs={tabs} />
      </SidePanelBody>
      <SidePanelFooter>
        <Button color='primary' onClick={handleAccept} size='sm'>
          Accept
        </Button>
        <Button color='outline' onClick={handleClearAll} size='sm'>
          Clear All
        </Button>
        <Button color='outline' onClick={handleCancel} size='sm'>
          Cancel
        </Button>
      </SidePanelFooter>
    </SidePanel>
  );
};
