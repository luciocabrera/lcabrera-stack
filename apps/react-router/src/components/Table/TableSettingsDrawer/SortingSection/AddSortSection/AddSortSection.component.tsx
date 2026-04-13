import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import { Button } from '@/components/Button';
import { SidePanelSectionHeader } from '@/components/SidePanel';
import { useGetColumns } from '@/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook';
import { VirtualSelect } from '@/components/VirtualSelect';

import type { AddSortSectionProps } from './AddSortSection.types.ts';

import { useSetColumnsSortings } from '../../TableDrawerContext/actions/index.ts';
import { useGetColumnsSorting } from '../../TableDrawerContext/selectors/index.ts';
import { styles } from './AddSortSection.stylex.ts';

export const AddSortSection = ({
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
        !sorting.some((s) => s.columnKey === col.key),
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
