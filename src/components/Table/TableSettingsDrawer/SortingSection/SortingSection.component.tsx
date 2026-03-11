import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

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
import { VirtualSelect } from '@/components/VirtualSelect';
import { ICON_SIZE_MD } from '@/design-system/constants';

import type { SortingSectionProps, SortItem } from './SortingSection.types';

import { useSetColumnsSortings } from '../TableDrawerContext/actions';
import { useGetColumnsSorting } from '../TableDrawerContext/selectors';
import { styles } from './SortingSection.stylex';
import { SortingSectionFooter } from './SortingSectionFooter';
import { getSelectedColumnLabel } from './utils';

export const SortingSection = ({ ...props }: SortingSectionProps) => {
  const columns = useGetColumns();
  const sorting = useGetColumnsSorting();

  const onSortChange = useSetColumnsSortings();

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
                <SortAscIcon size={ICON_SIZE_MD} />
              ) : (
                <SortDescIcon size={ICON_SIZE_MD} />
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
            icon={<MenuCloseIcon size={ICON_SIZE_MD} />}
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
        <SidePanelSectionHeader title='Add Sort Column' />
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

      <SidePanelSection>
        <SidePanelSectionHeader
          title={`Sort Order (${sortItems.length})`}
          toolbar={<SortingSectionFooter variant='toolbar' />}
        />
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
      </SidePanelSection>

      <SortingSectionFooter />
    </div>
  );
};
