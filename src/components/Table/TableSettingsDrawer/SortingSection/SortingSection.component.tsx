import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import type { DraggableItem } from '@/components/DraggableList';

import { Button } from '@/components/Button';
import { DraggableList } from '@/components/DraggableList';
import { MenuCloseIcon, SortAscIcon, SortDescIcon } from '@/components/Icons';
import { InfoBox } from '@/components/InfoBox';
import { useGetColumns } from '@/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook';
import { VirtualSelect } from '@/components/VirtualSelect';

import type { SortingSectionProps, SortItem } from './SortingSection.types';

import {
  useResetSorting,
  useSetColumnsSortings,
} from '../TableDrawerContext/hooks/store/columns/actions';
import {
  useGetColumnOrder,
  useGetColumnsSorting,
} from '../TableDrawerContext/hooks/store/columns/selectors';
import { styles } from './SortingSection.stylex';
import { getSelectedColumnLabel } from './utils';

export const SortingSection = ({ ...props }: SortingSectionProps) => {
  const columns = useGetColumns();
  const columnOrder = useGetColumnOrder();
  const sorting = useGetColumnsSorting();

  const onSortChange = useSetColumnsSortings();
  const resetSorting = useResetSorting();

  const [selectedColumn, setSelectedColumn] = useState('');

  // Filter to only sortable columns
  const sortableColumns = columns.filter((col) => col.isSortable !== false);
  // Get columns not yet in sort list
  const availableColumns = sortableColumns.filter(
    (col) => !sorting.some((s) => s.columnKey === col.key),
  );

  // Map available columns to label strings for VirtualSelect
  const availableColumnLabels = availableColumns.map((col) => col.label);

  // Resolve selected column key to its label for VirtualSelect
  const selectedColumnLabel = getSelectedColumnLabel({
    selectedColumn,
    sortableColumns,
  });

  const handleColumnSelect = (selectedLabels: string[]) => {
    const label = selectedLabels[0];
    if (!label) {
      setSelectedColumn('');
      return;
    }
    const col = availableColumns.find((c) => c.label === label);
    setSelectedColumn(col?.key ?? '');
  };

  // Convert sorting state to sort items with labels
  const sortItems: SortItem[] = sorting.map((sort) => ({
    columnKey: sort.columnKey,
    direction: sort.direction,
    label:
      sortableColumns.find((col) => col.key === sort.columnKey)?.label ??
      sort.columnKey,
  }));

  const handleAddSort = () => {
    if (!selectedColumn) return;

    // Check if column is already in sort list
    if (sorting.some((s) => s.columnKey === selectedColumn)) {
      setSelectedColumn('');
      return;
    }

    onSortChange([...sorting, { columnKey: selectedColumn, direction: 'asc' }]);
    setSelectedColumn('');
  };

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

  const handleClearSorting = () => {
    onSortChange([]);
  };

  const handleSortByColumnOrder = () => {
    // Use column order if set, otherwise fall back to definition order
    const orderedSortable =
      columnOrder.length > 0
        ? columnOrder
            .map((key) => sortableColumns.find((col) => col.key === key))
            .filter(
              (col): col is (typeof sortableColumns)[0] => col !== undefined,
            )
        : sortableColumns;

    onSortChange(
      orderedSortable.map((col) => ({
        columnKey: col.key,
        direction: 'asc' as const,
      })),
    );
  };

  // Convert sort items to draggable items
  const draggableItems: DraggableItem[] = sortItems.map((item) => ({
    content: (
      <div {...stylex.props(styles.sortItem)}>
        <span {...stylex.props(styles.sortItemLabel)}>{item.label}</span>
        <div {...stylex.props(styles.sortItemControls)}>
          <Button
            aria-label={`Sort ${item.direction === 'asc' ? 'ascending' : 'descending'}`}
            color='ghost'
            icon={
              item.direction === 'asc' ? (
                <SortAscIcon size={16} />
              ) : (
                <SortDescIcon size={16} />
              )
            }
            onClick={() => {
              handleToggleDirection(item.columnKey);
            }}
            size='mini'
          />
          <Button
            aria-label='Remove sort'
            color='ghost'
            icon={<MenuCloseIcon size={16} />}
            onClick={() => {
              handleRemoveSort(item.columnKey);
            }}
            size='mini'
          />
        </div>
      </div>
    ),
    id: item.columnKey,
  }));

  return (
    <div {...stylex.props(styles.container)} {...props}>
      <div {...stylex.props(styles.addSection)}>
        <h3 {...stylex.props(styles.header)}>Add Sort Column</h3>
        <VirtualSelect
          mode='single'
          onChange={handleColumnSelect}
          options={availableColumnLabels}
          placeholder='Select a column...'
          selected={selectedColumnLabel}
        />
        <Button
          isDisabled={!selectedColumn}
          onClick={handleAddSort}
          size='sm'
          width='full'
        >
          Add
        </Button>
      </div>

      <div {...stylex.props(styles.sortOrderSection)}>
        <h3 {...stylex.props(styles.header)}>
          Sort Order ({sortItems.length})
        </h3>
        {sortItems.length === 0 ? (
          <InfoBox>
            No sorting applied. Add a column above to start sorting.
          </InfoBox>
        ) : (
          <div {...stylex.props(styles.sortList)}>
            <DraggableList
              items={draggableItems}
              onOrderChange={handleReorder}
            />
          </div>
        )}
      </div>

      {/* Sorting Actions */}
      <div {...stylex.props(styles.resetSection)}>
        <Button
          color='outline'
          onClick={handleSortByColumnOrder}
          size='sm'
          width='full'
        >
          Sort by Column Order
        </Button>
        <Button
          color='outline'
          isDisabled={sortItems.length === 0}
          onClick={handleClearSorting}
          size='sm'
          width='full'
        >
          Clear Sorting
        </Button>
        <Button
          color='outline'
          onClick={resetSorting}
          size='sm'
          width='full'
        >
          Reset Sorting
        </Button>
      </div>
    </div>
  );
};
