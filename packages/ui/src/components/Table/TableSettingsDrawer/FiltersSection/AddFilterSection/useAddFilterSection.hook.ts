import { useState } from 'react';

import { useGetColumns } from '#ui/components/Table/contexts/TableConfig/columns/selectors';
import { useSetTableSettingsExpandedFilters } from '#ui/components/Table/contexts/TableConfig/meta/actions';
import { useGetTableSettingsExpandedFilters } from '#ui/components/Table/contexts/TableConfig/meta/selectors';
import { resolveColumnCapabilities } from '#ui/components/Table/utils/resolveColumnCapabilities.util';

import { useSetColumnFilters } from '../../TableDrawerContext/actions';
import { useGetColumnFilters } from '../../TableDrawerContext/selectors';
import { createInitialFilter } from './utils/createInitialFilter.util';

type UseAddFilterSectionArgs = {
  readonly onDropdownOpenChange?: (isOpen: boolean) => void;
};

export const useAddFilterSection = ({
  onDropdownOpenChange,
}: UseAddFilterSectionArgs) => {
  const columns = useGetColumns();
  const filters = useGetColumnFilters();
  const expandedFilters = useGetTableSettingsExpandedFilters();

  const onFiltersChange = useSetColumnFilters();
  const setExpandedFilters = useSetTableSettingsExpandedFilters();
  const [selectedColumn, setSelectedColumn] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const filterableColumns = columns.filter(
    (col) => resolveColumnCapabilities(col).isFilterable,
  );

  const filterableColumnOptions = filterableColumns.map((col) => {
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

    const column = filterableColumns.find((col) => col.key === selectedColumn);
    if (!column) return;

    onFiltersChange({
      ...filters,
      [selectedColumn]: createInitialFilter(column.dataType),
    });

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
