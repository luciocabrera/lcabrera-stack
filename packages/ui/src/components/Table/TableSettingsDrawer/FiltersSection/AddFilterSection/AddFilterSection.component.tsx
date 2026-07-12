import { Button } from '@repo/ui/components/Button';
import { SidePanelSectionHeader } from '@repo/ui/components/SidePanel';
import {
  useGetColumns,
  useGetNormalizedColumns,
} from '@repo/ui/components/Table/contexts/TableConfig/columns/selectors';
import { VirtualSelect } from '@repo/ui/components/VirtualSelect';
import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import type { AddFilterSectionProps } from './AddFilterSection.types';

import { useSetColumnFilters } from '../../TableDrawerContext/actions';
import { useGetColumnFilters } from '../../TableDrawerContext/selectors';
import { styles } from './AddFilterSection.stylex';

export const AddFilterSection = ({
  expandedFilters,
  isBusy = false,
  onDropdownOpenChange,
  onExpandedFiltersChange,
}: AddFilterSectionProps) => {
  const columns = useGetColumns();
  const filters = useGetColumnFilters();
  const normalizedColumns = useGetNormalizedColumns();

  const onFiltersChange = useSetColumnFilters();
  const [selectedColumn, setSelectedColumn] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Filter to only filterable columns and build { label, value } options
  const filterableColumnOptions = columns
    .filter((col) => col.isFilterable !== false)
    .map((col) => {
      const hasActiveFilter = Object.hasOwn(filters, col.key);
      return {
        label: hasActiveFilter ? `${col.label} ⚠️ (filtered)` : col.label,
        value: col.key,
      };
    });

  const handleOpenChange = (isOpen: boolean) => {
    setIsDropdownOpen(isOpen);
    onDropdownOpenChange?.(isOpen);
  };

  const handleAddFilter = () => {
    if (!selectedColumn) return;

    const column = normalizedColumns[selectedColumn];
    if (!column) return;

    // Create initial filter based on column type
    let initialFilter;
    switch (column.dataType) {
      case 'boolean': {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        initialFilter = { type: 'boolean' as const, value: true };
        break;
      }
      case 'currency':
      case 'number': {
        initialFilter = {
          operator: 'equals' as const,
          type: 'number' as const,
          value: 0,
        };
        break;
      }
      case 'date': {
        initialFilter = {
          operator: 'equals' as const,
          type: 'date' as const,
          value: '',
        };
        break;
      }
      default: {
        initialFilter = {
          operator: 'equals' as const,
          type: 'text' as const,
          value: '',
        };
        break;
      }
    }

    const newFilters = { ...filters, [selectedColumn]: initialFilter };
    onFiltersChange(newFilters);

    // Expand the newly added filter
    onExpandedFiltersChange(new Set([selectedColumn, ...expandedFilters]));
    setSelectedColumn('');
  };

  const handleVirtualSelectChange = (values: string[]) => {
    setSelectedColumn(values[0] ?? '');
  };

  return (
    <div {...stylex.props(styles.container)}>
      <SidePanelSectionHeader title='Add Filter' />
      <VirtualSelect
        isBusy={isBusy}
        mode='single'
        onChange={handleVirtualSelectChange}
        onOpenChange={handleOpenChange}
        options={filterableColumnOptions}
        placeholder='Select a column...'
        selected={selectedColumn ? [selectedColumn] : []}
      />
      {!isDropdownOpen && (
        <Button
          isBusy={isBusy}
          isDisabled={!selectedColumn}
          onClick={handleAddFilter}
          size='sm'
          width='full'
        >
          Add
        </Button>
      )}
    </div>
  );
};
