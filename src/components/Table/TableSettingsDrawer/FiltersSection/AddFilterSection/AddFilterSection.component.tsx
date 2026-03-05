import * as stylex from '@stylexjs/stylex';
import { useCallback, useState } from 'react';

import { Button } from '@/components/Button';
import {
  useGetColumns,
  useGetNormalizedColumns,
} from '@/components/Table/contexts/TableConfig/columns/selectors';
import { VirtualSelect } from '@/components/VirtualSelect';

import type { AddFilterSectionProps } from './AddFilterSection.types';

import { useSetColumnFilters } from '../../TableDrawerContext/actions';
import { useGetColumnFilters } from '../../TableDrawerContext/selectors';
import { styles } from './AddFilterSection.stylex';
import { getSelectedColumnLabel } from './utils';

export const AddFilterSection = ({
  expandedFilters,
  onExpandedFiltersChange,
}: AddFilterSectionProps) => {
  // === SELECTORS (subscribe to state) ===
  const columns = useGetColumns();
  const filters = useGetColumnFilters();
  const normalizedColumns = useGetNormalizedColumns();

  // === ACTIONS (get mutation functions) ===
  const onFiltersChange = useSetColumnFilters();
  const [selectedColumn, setSelectedColumn] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleOpenChange = useCallback((isOpen: boolean) => {
    setIsDropdownOpen(isOpen);
  }, []);

  // Filter to only filterable columns
  const filterableColumns = columns.filter((col) => col.isFilterable !== false);
  // Map filterable columns to label strings for VirtualSelect
  const filterableColumnLabels = filterableColumns.map((col) => {
    const hasActiveFilter = Boolean(filters[col.key]);
    return hasActiveFilter ? `${col.label} ⚠️ (filtered)` : col.label;
  });

  // Resolve selected column key to its label for VirtualSelect
  const selectedColumnLabel = getSelectedColumnLabel({
    filterableColumns,
    filters,
    selectedColumn,
  });

  const handleColumnSelect = (selectedLabels: string[]) => {
    const label = selectedLabels[0];
    if (!label) {
      setSelectedColumn('');
      return;
    }
    // Strip the " ⚠️ (filtered)" suffix when matching
    const cleanLabel = label.replace(' ⚠️ (filtered)', '');
    const col = filterableColumns.find((c) => c.label === cleanLabel);
    setSelectedColumn(col?.key ?? '');
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
        // Check if column has fetchable filter options
        // Use text filter with 'equals' operator for columns with options
        // so the select list shows up immediately
        const hasOptions = Boolean(column.fetchFilterOptions);
        initialFilter = hasOptions
          ? { operator: 'equals' as const, type: 'text' as const, value: '' }
          : { operator: 'equals' as const, type: 'text' as const, value: '' };
        break;
      }
    }

    const newFilters = { ...filters, [selectedColumn]: initialFilter };
    onFiltersChange(newFilters);

    // Expand the newly added filter
    onExpandedFiltersChange(new Set([selectedColumn, ...expandedFilters]));
    setSelectedColumn('');
  };

  return (
    <div {...stylex.props(styles.container)}>
      <h3 {...stylex.props(styles.header)}>Add Filter</h3>
      <VirtualSelect
        mode='single'
        onChange={handleColumnSelect}
        onOpenChange={handleOpenChange}
        options={filterableColumnLabels}
        placeholder='Select a column...'
        selected={selectedColumnLabel}
      />
      {!isDropdownOpen && (
        <Button
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
