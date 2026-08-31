import * as stylex from '@stylexjs/stylex';

import type { DraggableItem } from '#ui/components/DraggableList';

import { DraggableList } from '#ui/components/DraggableList';
import { InfoBox } from '#ui/components/InfoBox';
import {
  SidePanelSection,
  SidePanelSectionHeader,
} from '#ui/components/SidePanel';
import { useGetColumns } from '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook';
import { resolveAggregateColumnLabel } from '#ui/components/Table/utils/resolveAggregateColumnLabel.util';
import { resolveColumnCapabilities } from '#ui/components/Table/utils/resolveColumnCapabilities.util';

import type { SortItem } from '../SortingSection.types';
import type { ActiveSortListProps } from './ActiveSortList.types';

import { useSetColumnsSortings } from '../../TableDrawerContext/actions';
import { useGetColumnsSorting } from '../../TableDrawerContext/selectors';
import { useGroupedSortScope } from '../hooks';
import { SortingSectionToolbar } from '../SortingSectionToolbar';
import { styles } from './ActiveSortList.stylex';
import { SortItemContent } from './SortItemContent';

export const ActiveSortList = ({ isBusy = false }: ActiveSortListProps) => {
  const columns = useGetColumns();
  const sorting = useGetColumnsSorting();
  const onSortChange = useSetColumnsSortings();
  const isInSortScope = useGroupedSortScope();

  // Filter to only sortable columns
  const sortableColumns = columns.filter(
    (col) => resolveColumnCapabilities(col).isSortable,
  );

  const toSortItem = (sort: (typeof sorting)[number]): SortItem => ({
    columnKey: sort.columnKey,
    direction: sort.direction,
    label:
      sortableColumns.find((col) => String(col.key) === sort.columnKey)
        ?.label ??
      resolveAggregateColumnLabel({ columnKey: sort.columnKey, columns }) ??
      sort.columnKey,
  });

  const isMeasure = (columnKey: string) =>
    resolveAggregateColumnLabel({ columnKey, columns }) !== undefined;

  // Grouped, `toGroupSort` keeps only the terms naming a group key or a staged
  // measure and silently drops the rest, so any other sort here is a row that
  // orders nothing. It stays in state — clearing the grouping brings it back —
  // and is only kept out of the list and out of the reorder.
  const scopedSorting = sorting.filter((sort) => isInSortScope(sort.columnKey));
  const unscopedSorting = sorting.filter(
    (sort) => !isInSortScope(sort.columnKey),
  );

  // A measure always sorts innermost, whatever its position here:
  // `buildGroupOrderByClause` splices every aggregate term in at the last group
  // key. Showing one above a column sort would state a precedence the read does
  // not apply, so the two are kept as blocks in that order.
  const sortItems: SortItem[] = [
    ...scopedSorting.filter((sort) => !isMeasure(sort.columnKey)),
    ...scopedSorting.filter((sort) => isMeasure(sort.columnKey)),
  ].map((sort) => toSortItem(sort));

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
    onSortChange([...newSorting, ...unscopedSorting]);
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
    groupId: isMeasure(item.columnKey) ? 'measure' : 'column',
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
