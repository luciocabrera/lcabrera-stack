// import { useMemo } from 'react';

import type { TabItem } from '@/components/Tabs';

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
// import { useGetColumns } from '@/components/Table/TableContext/hooks/store/columns/selectors';
import { Tabs } from '@/components/Tabs';

import type { TableSettingsDrawerProps } from './TableSettingsDrawer.types';

import { ColumnOrderSection } from './ColumnOrderSection';
import { FiltersSection } from './FiltersSection';
// import { validateFilter } from './FiltersSection/FilterEditor';
import { GeneralSettingsSection } from './GeneralSettingsSection';
import { SortingSection } from './SortingSection';
import {
  useBatchSetTableDrawerSettings,
  useResetTableSettings,
} from './TableDrawerContext/hooks/store/columns/actions';

export const TableSettingsDrawer = ({
  isOpen,
  isPinned,
  onClose,
  onPinChange,
}: TableSettingsDrawerProps) => {
  // Subscribe to table state from context

  // const columns = useGetColumns();
  // const columnSizing = useGetColumnSizing();
  // const columnsOrder = useGetColumnOrder();
  // const columnVisibility = useGetColumnVisibility();
  // const columnFilters = useGetColumnFilters();
  // const columnsSorting = useGetColumnsSorting();

  const batchSetTableDrawerSettings = useBatchSetTableDrawerSettings();
  const resetTableDrawerSettings = useResetTableSettings();

  // const [pendingColumnFilters, setPendingColumnFilters] =
  //   useState(columnFilters);
  // const [pendingSorting, setPendingSorting] = useState(columnsSorting);
  // const [pendingColumnOrder, setPendingColumnOrder] = useState(columnsOrder);
  // const [pendingColumnSizing, setPendingColumnSizing] = useState(columnSizing);
  // const [pendingColumnVisibility, setPendingColumnVisibility] =
  //   useState(columnVisibility);

  // Update pending state when initialPendingState changes (when drawer opens with new values)
  // useEffect(() => {
  //   setPendingColumnFilters(columnFilters);
  //   setPendingSorting(columnsSorting);
  //   setPendingColumnOrder(columnsOrder);
  //   setPendingColumnSizing(columnSizing);
  //   setPendingColumnVisibility(columnVisibility);
  // }, [
  //   columnFilters,
  //   columnsSorting,
  //   columnsOrder,
  //   columnSizing,
  //   columnVisibility,
  // ]);
const areFiltersValid = true; // TODO: implement filter validation
  // Validate all filters before allowing accept
  // const areFiltersValid = useMemo(() => {
  //   return Object.values(pendingColumnFilters).every((filter) =>
  //     validateFilter(filter),
  //   );
  // }, [pendingColumnFilters]);

  const handleAccept = () => {
    // if (!areFiltersValid) {
    //   // Don't allow accept if filters are invalid
    //   return;
    // }

    // Batch update all store state at once
    // This prevents race conditions where intermediate updates trigger
    // the sync effect and overwrite pending values with stale store values
    batchSetTableDrawerSettings();

    // console.log('[handleAccept] After batchSetTableSettings');

    // Unpin if pinned, then close
    if (isPinned) {
      onPinChange?.(false);
    }
    onClose();
  };

  const handleCancel = () => {
    // Reset to original values
    // setPendingColumnFilters(columnFilters);
    // setPendingSorting(columnsSorting);
    // setPendingColumnOrder(columnsOrder);
    // setPendingColumnSizing(columnSizing);
    // setPendingColumnVisibility(columnVisibility);
    resetTableDrawerSettings();
    // Unpin if pinned, then close
    if (isPinned) onPinChange?.(false);

    onClose();
  };

  const handleTogglePin = () => {
    onPinChange?.(!isPinned);
  };

  const tabs: TabItem[] = [
    {
      children: <GeneralSettingsSection />,
      header: 'General',
      key: 'general',
    },
    {
      children: <SortingSection />,
      header: ' Sorting',
      // header: (() => {
      //   const sortCount = pendingSorting.length;
      //   return sortCount > 0 ? `Sorting (${sortCount})` : 'Sorting';
      // })(),
      key: 'sorting',
    },
    {
      children: <FiltersSection />,
      header: 'Filters',
      // header: (() => {
      //   const filterCount = Object.keys(pendingColumnFilters).length;
      //   return filterCount > 0 ? `Filters (${filterCount})` : 'Filters';
      // })(),
      key: 'filters',
    },
    {
      children: <ColumnOrderSection />,
      header: 'Columns',
      key: 'columns',
    },
  ];

  return (
    <SidePanel
      isOpen={isOpen}
      isPinned={isPinned}
      onClose={handleCancel}
      position='right'
      size='md'
    >
      <SidePanelHeader
        actions={
          <>
            {onPinChange && (
              <Button
                aria-label={isPinned ? 'Unpin drawer' : 'Pin drawer'}
                color='ghost'
                icon={
                  isPinned ? <PinIcon size={16} /> : <PinOffIcon size={16} />
                }
                onClick={handleTogglePin}
                size='mini'
                title={isPinned ? 'Unpin drawer' : 'Pin drawer'}
              />
            )}
            <Button
              aria-label='Close drawer'
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
          Table Settings
        </SidePanelTitle>
      </SidePanelHeader>
      <SidePanelBody>
        <Tabs tabs={tabs} />
      </SidePanelBody>
      <SidePanelFooter>
        <Button
          color='primary'
          isDisabled={!areFiltersValid}
          onClick={handleAccept}
          size='sm'
          title={
            areFiltersValid
              ? undefined
              : 'Please fix invalid filters before accepting'
          }
        >
          Accept
        </Button>
        <Button color='outline' onClick={handleCancel} size='sm'>
          Cancel
        </Button>
      </SidePanelFooter>
    </SidePanel>
  );
};
