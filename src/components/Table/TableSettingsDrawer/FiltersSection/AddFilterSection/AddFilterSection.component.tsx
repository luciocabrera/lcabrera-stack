import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

import { Button } from '@/components/Button';
import {
  useGetColumns,
  useGetNormalizedColumns,
} from '@/components/Table/contexts/TableConfig/columns/selectors';

import type { AddFilterSectionProps } from './AddFilterSection.types';

import { useSetColumnFilters } from '../../TableDrawerContext/hooks/store/columns/actions';
import { useGetColumnFilters } from '../../TableDrawerContext/hooks/store/columns/selectors';
import { styles } from './AddFilterSection.stylex';

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

  // Filter to only filterable columns
  const filterableColumns = columns.filter((col) => col.isFilterable !== false);

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
        // Check if column has filter options (static or fetchable)
        // Use text filter with 'equals' operator for columns with options
        // so the select list shows up immediately
        const hasOptions =
          Boolean(column.filterOptions && column.filterOptions.length > 0) ||
          Boolean(column.fetchFilterOptions);
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
      <select
        {...stylex.props(styles.select)}
        onChange={(e) => {
          setSelectedColumn(e.target.value);
        }}
        value={selectedColumn}
      >
        <option value=''>Select a column...</option>
        {filterableColumns.map((col) => {
          const hasActiveFilter = Boolean(filters[col.key]);
          return (
            <option key={col.key} value={col.key}>
              {col.label}
              {hasActiveFilter ? ' ⚠️ (filtered)' : ''}
            </option>
          );
        })}
      </select>
      <Button
        isDisabled={!selectedColumn}
        onClick={handleAddFilter}
        size='sm'
        width='full'
      >
        Add
      </Button>
    </div>
  );
};
