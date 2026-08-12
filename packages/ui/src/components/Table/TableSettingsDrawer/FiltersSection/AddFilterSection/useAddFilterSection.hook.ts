import { useState } from 'react';

import {
  useGetColumns,
  useGetNormalizedColumns,
} from '#ui/components/Table/contexts/TableConfig/columns/selectors';
import { useSetTableSettingsExpandedFilters } from '#ui/components/Table/contexts/TableConfig/meta/actions';
import { useGetTableSettingsExpandedFilters } from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import { resolveColumnCapabilities } from '#ui/components/Table/utils/resolveColumnCapabilities.util';

import { useSetColumnFilters } from '../../TableDrawerContext/actions';
import { useGetColumnFilters } from '../../TableDrawerContext/selectors';
import { createInitialFilter } from './utils/createInitialFilter.util';

type UseAddFilterSectionArgs = {
  readonly onDropdownOpenChange?: (isOpen: boolean) => void;
};

/**
 * Store wiring and behavior for AddFilterSection: builds the filterable
 * column options (flagging already-filtered columns), owns the column-picker
 * selection and dropdown-open state, and runs the add flow — initialize a
 * filter for the selected column's data type, write it to the drawer draft,
 * and expand the new filter first.
 */
export const useAddFilterSection = ({
  onDropdownOpenChange,
}: UseAddFilterSectionArgs) => {
  const columns = useGetColumns();
  const filters = useGetColumnFilters();
  const normalizedColumns = useGetNormalizedColumns();
  const expandedFilters = useGetTableSettingsExpandedFilters();

  const onFiltersChange = useSetColumnFilters();
  const setExpandedFilters = useSetTableSettingsExpandedFilters();
  const [selectedColumn, setSelectedColumn] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Filter to only filterable columns and build { label, value } options
  const filterableColumnOptions = columns
    .filter((col) => resolveColumnCapabilities(col).isFilterable)
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

    onFiltersChange({
      ...filters,
      [selectedColumn]: createInitialFilter(column.dataType),
    });

    // Expand the newly added filter
    setExpandedFilters([
      selectedColumn,
      ...expandedFilters.filter((key) => key !== selectedColumn),
    ]);
    setSelectedColumn('');
  };

  const handleVirtualSelectChange = (values: string[]) => {
    setSelectedColumn(values[0] ?? '');
  };

  return {
    filterableColumnOptions,
    handleAddFilter,
    handleOpenChange,
    handleVirtualSelectChange,
    isDropdownOpen,
    selectedColumn,
  };
};
