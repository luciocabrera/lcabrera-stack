import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import { Button } from '#ui/components/Button';
import { SidePanelSectionHeader } from '#ui/components/SidePanel';
import { useGetColumns } from '#ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook';
import { resolveColumnCapabilities } from '#ui/components/Table/utils/resolveColumnCapabilities.util';
import { VirtualSelect } from '#ui/components/VirtualSelect';

import type { AddSortSectionProps } from './AddSortSection.types';

import { useSetColumnsSortings } from '../../TableDrawerContext/actions';
import { useGetColumnsSorting } from '../../TableDrawerContext/selectors';
import { useGroupedSortScope } from '../hooks';
import { styles } from './AddSortSection.stylex';

export const AddSortSection = ({
  isBusy = false,
  onDropdownOpenChange,
}: AddSortSectionProps) => {
  const columns = useGetColumns();
  const sorting = useGetColumnsSorting();
  const onSortChange = useSetColumnsSortings();
  const isInSortScope = useGroupedSortScope();

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
        resolveColumnCapabilities(col).isSortable &&
        isInSortScope(String(col.key)) &&
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
