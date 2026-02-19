import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import type { DraggableItem } from '@/components/DraggableList';

import { Button } from '@/components/Button';
import { DraggableList } from '@/components/DraggableList';
import { MenuCloseIcon, SortAscIcon, SortDescIcon } from '@/components/Icons';
import { InfoBox } from '@/components/InfoBox';
import { useGetColumns } from '@/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook';

import type { SortingSectionProps, SortItem } from './SortingSection.types';

import { useSetColumnsSortings } from '../TableDrawerContext/hooks/store/columns/actions';
import { useGetColumnsSorting } from '../TableDrawerContext/hooks/store/columns/selectors';
import { styles } from './SortingSection.stylex';

export const SortingSection = ({ ...props }: SortingSectionProps) => {
  const columns = useGetColumns();
  const sorting = useGetColumnsSorting();
  const onSortChange = useSetColumnsSortings();

  const [selectedColumn, setSelectedColumn] = useState('');

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

  const handleResetSorting = () => {
    onSortChange([]);
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

  // Get columns not yet in sort list
  const availableColumns = sortableColumns.filter(
    (col) => !sorting.some((s) => s.columnKey === col.key),
  );

  return (
    <div {...stylex.props(styles.container)} {...props}>
      <div {...stylex.props(styles.addSection)}>
        <h3 {...stylex.props(styles.header)}>Add Sort Column</h3>
        <select
          {...stylex.props(styles.select)}
          onChange={(e) => {
            setSelectedColumn(e.target.value);
          }}
          value={selectedColumn}
        >
          <option value=''>Select a column...</option>
          {availableColumns.map((col) => (
            <option key={col.key} value={col.key}>
              {col.label}
            </option>
          ))}
        </select>
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
        <h3 {...stylex.props(styles.header)}>Sort Order</h3>
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

      {/* Reset Sorting Section */}
      {sortItems.length > 0 && (
        <div {...stylex.props(styles.resetSection)}>
          <Button
            color='outline'
            onClick={handleResetSorting}
            size='sm'
            width='full'
          >
            Reset Sorting
          </Button>
        </div>
      )}
    </div>
  );
};
