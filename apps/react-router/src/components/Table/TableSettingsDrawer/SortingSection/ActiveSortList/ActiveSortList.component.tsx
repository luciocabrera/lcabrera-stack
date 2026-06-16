import * as stylex from '@stylexjs/stylex';

import type { DraggableItem } from '@/components/DraggableList';

import { Button } from '@/components/Button';
import { DraggableList } from '@/components/DraggableList';
import { MenuCloseIcon, SortAscIcon, SortDescIcon } from '@/components/Icons';
import { InfoBox } from '@/components/InfoBox';
import {
  SidePanelSection,
  SidePanelSectionHeader,
} from '@/components/SidePanel';
import { useGetColumns } from '@/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook';
import { ICON_SIZE_MD } from '@/design-system/constants';

import type { SortItem } from '../SortingSection.types';
import type { ActiveSortListProps } from './ActiveSortList.types';

import { useSetColumnsSortings } from '../../TableDrawerContext/actions';
import { useGetColumnsSorting } from '../../TableDrawerContext/selectors';
import { styles } from './ActiveSortList.stylex';
import { SortingSectionToolbar } from '../SortingSectionToolbar';

export const ActiveSortList = ({ isBusy = false }: ActiveSortListProps) => {
  const columns = useGetColumns();
  const sorting = useGetColumnsSorting();
  const onSortChange = useSetColumnsSortings();

  // Filter to only sortable columns
  const sortableColumns = columns.filter((col) => col.isSortable !== false);

  // Convert sorting state to sort items with labels
  const sortItems: SortItem[] = sorting.map((sort) => ({
    columnKey: sort.columnKey,
    direction: sort.direction,
    label:
      sortableColumns.find((col) => col.key === sort.columnKey)?.label ??
      sort.columnKey,
  }));

  const handleRemoveSort = (columnKey: string) => {
    onSortChange(sorting.filter((s) => s.columnKey !== columnKey));
  };

  const handleToggleDirection = (columnKey: string) => {
    onSortChange(
      sorting.map((s) =>
        s.columnKey === columnKey
          ? { ...s, direction: s.direction === 'asc' ? 'desc' : 'asc' }
          : s,
      ),
    );
  };

  const handleReorder = (reorderedItems: DraggableItem[]) => {
    const newSorting = reorderedItems.map((item) => {
      const existingSort = sorting.find((s) => s.columnKey === item.id);
      return {
        columnKey: item.id,
        direction: existingSort?.direction ?? 'asc',
      };
    });
    onSortChange(newSorting);
  };

  // Convert sort items to draggable items
  const draggableItems: DraggableItem[] = sortItems.map((item) => ({
    content: (
      <div {...stylex.props(styles.sortItem)}>
        <span {...stylex.props(styles.sortItemLabel)}>{item.label}</span>
        <div {...stylex.props(styles.sortItemControls)}>
          <Button
            aria-label={`Sort ${item.label} ${item.direction === 'asc' ? 'ascending' : 'descending'}`}
            color='ghost'
            icon={
              item.direction === 'asc' ? (
                <SortAscIcon size={ICON_SIZE_MD} />
              ) : (
                <SortDescIcon size={ICON_SIZE_MD} />
              )
            }
            isBusy={isBusy}
            onClick={() => {
              handleToggleDirection(item.columnKey);
            }}
            size='mini'
            tooltipContent={`Sort ${item.label} ${item.direction === 'asc' ? 'ascending' : 'descending'}`}
          />
          <Button
            aria-label={`Remove ${item.label} sort`}
            color='ghost'
            icon={<MenuCloseIcon size={ICON_SIZE_MD} />}
            isBusy={isBusy}
            onClick={() => {
              handleRemoveSort(item.columnKey);
            }}
            size='mini'
            tooltipContent={`Remove ${item.label} sort`}
          />
        </div>
      </div>
    ),
    id: item.columnKey,
  }));

  return (
    <SidePanelSection>
      <SidePanelSectionHeader
        title={`Sort Order (${sortItems.length})`}
        toolbar={<SortingSectionToolbar isBusy={isBusy} variant='toolbar' />}
      />
      {sortItems.length === 0 ? (
        <InfoBox>
          No sorting applied. Add a column above to start sorting.
        </InfoBox>
      ) : (
        <div {...stylex.props(styles.sortList)}>
          <DraggableList
            isBusy={isBusy}
            items={draggableItems}
            onOrderChange={handleReorder}
          />
        </div>
      )}
    </SidePanelSection>
  );
};
