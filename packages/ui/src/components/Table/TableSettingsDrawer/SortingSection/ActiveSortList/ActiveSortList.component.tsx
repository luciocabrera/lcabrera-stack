import * as stylex from '@stylexjs/stylex';

import type { DraggableItem } from '@repo/ui/components/DraggableList';

import { DraggableList } from '@repo/ui/components/DraggableList';
import { InfoBox } from '@repo/ui/components/InfoBox';
import {
  SidePanelSection,
  SidePanelSectionHeader,
} from '@repo/ui/components/SidePanel';
import { useGetColumns } from '@repo/ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook';

import type { SortItem } from '../SortingSection.types';
import type { ActiveSortListProps } from './ActiveSortList.types';

import { useSetColumnsSortings } from '../../TableDrawerContext/actions';
import { useGetColumnsSorting } from '../../TableDrawerContext/selectors';
import { SortingSectionToolbar } from '../SortingSectionToolbar';
import { styles } from './ActiveSortList.stylex';
import { SortItemContent } from './SortItemContent';

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
      <SortItemContent
        isBusy={isBusy}
        item={item}
        onRemove={handleRemoveSort}
        onToggleDirection={handleToggleDirection}
      />
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
