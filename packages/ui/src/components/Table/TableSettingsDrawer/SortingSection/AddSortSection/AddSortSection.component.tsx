import { Button } from '@repo/ui/components/Button';
import { SidePanelSectionHeader } from '@repo/ui/components/SidePanel';
import { useGetColumns } from '@repo/ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook';
import { VirtualSelect } from '@repo/ui/components/VirtualSelect';
import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import type { AddSortSectionProps } from './AddSortSection.types';

import { useSetColumnsSortings } from '../../TableDrawerContext/actions';
import { useGetColumnsSorting } from '../../TableDrawerContext/selectors';
import { styles } from './AddSortSection.stylex';

export const AddSortSection = ({
  isBusy = false,
  onDropdownOpenChange,
}: AddSortSectionProps) => {
  const columns = useGetColumns();
  const sorting = useGetColumnsSorting();
  const onSortChange = useSetColumnsSortings();

  const [selectedColumn, setSelectedColumn] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleOpenChange = (isOpen: boolean) => {
    setIsDropdownOpen(isOpen);
    onDropdownOpenChange?.(isOpen);
  };

  // Filter to only sortable columns not already in the sort list
  const availableColumnOptions = columns
    .filter(
      (col) =>
        col.isSortable !== false &&
        sorting.every((s) => s.columnKey !== col.key),
    )
    .map((col) => ({ label: col.label, value: col.key }));

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
        isBusy={isBusy}
        mode='single'
        onChange={(values) => {
          setSelectedColumn(values[0] ?? '');
        }}
        onOpenChange={handleOpenChange}
        options={availableColumnOptions}
        placeholder='Select a column...'
        selected={selectedColumn ? [selectedColumn] : []}
      />
      {!isDropdownOpen && (
        <Button
          isBusy={isBusy}
          isDisabled={!selectedColumn}
          onClick={handleAddSort}
          variant='primary'
        >
          Add
        </Button>
      )}
    </div>
  );
};
