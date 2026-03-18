import * as stylex from '@stylexjs/stylex';
import { useCallback, useState } from 'react';

import { Button } from '@/components/Button';
import { SidePanelSectionHeader } from '@/components/SidePanel';
import { useGetColumns } from '@/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook';
import { VirtualSelect } from '@/components/VirtualSelect';

import type { AddSortSectionProps } from './AddSortSection.types';

import { useSetColumnsSortings } from '../../TableDrawerContext/actions';
import { useGetColumnsSorting } from '../../TableDrawerContext/selectors';
import { styles } from './AddSortSection.stylex';
import { getSelectedColumnLabel } from '../utils';

export const AddSortSection = ({
  onDropdownOpenChange,
}: AddSortSectionProps) => {
  const columns = useGetColumns();
  const sorting = useGetColumnsSorting();
  const onSortChange = useSetColumnsSortings();

  const [selectedColumn, setSelectedColumn] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      setIsDropdownOpen(isOpen);
      onDropdownOpenChange?.(isOpen);
    },
    [onDropdownOpenChange],
  );

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

  return (
    <div {...stylex.props(styles.container)}>
      <SidePanelSectionHeader title='Add Sort Column' />
      <VirtualSelect
        mode='single'
        onChange={handleColumnSelect}
        onOpenChange={handleOpenChange}
        options={availableColumnLabels}
        placeholder='Select a column...'
        selected={selectedColumnLabel}
      />
      {!isDropdownOpen && (
        <Button
          isDisabled={!selectedColumn}
          onClick={handleAddSort}
          size='sm'
          width='full'
        >
          Add
        </Button>
      )}
    </div>
  );
};
