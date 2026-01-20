import * as stylex from '@stylexjs/stylex';
import { useEffect, useState } from 'react';

import { Button } from '@/components/Button';
import { MenuCloseIcon } from '@/components/Icons';

import type { FiltersSectionProps } from './FiltersSection.types';

import { FilterEditor, validateFilter } from './FilterEditor';
import { styles } from './FiltersSection.stylex';

export const FiltersSection = ({
  columns,
  filters,
  onFiltersChange,
  ...props
}: FiltersSectionProps) => {
  const [selectedColumn, setSelectedColumn] = useState('');
  const [expandedFilters, setExpandedFilters] = useState<Set<string>>(
    () => new Set(),
  );
  // Track fetched options for columns with fetchFilterOptions
  const [fetchedOptions, setFetchedOptions] = useState<Record<string, string[]>>({});
  // Track hasMore state for pagination
  const [hasMoreOptions, setHasMoreOptions] = useState<Record<string, boolean>>({});
  // Track loading state for each column
  const [loadingOptions, setLoadingOptions] = useState<Record<string, boolean>>({});

  // Filter to only filterable columns
  const filterableColumns = columns.filter((col) => col.isFilterable !== false);

  // Fetch filter options for columns that need them
  useEffect(() => {
    const fetchOptionsForColumns = async () => {
      for (const [columnKey] of Object.entries(filters)) {
        const column = filterableColumns.find((col) => col.key === columnKey);
        if (column?.fetchFilterOptions && !fetchedOptions[columnKey]) {
          try {
            const result = await column.fetchFilterOptions(0);
            // fetchFilterOptions can return either string[] or {values: string[], hasMore: boolean}
            const options = Array.isArray(result) ? result : result.values;
            const hasMore = Array.isArray(result) ? false : result.hasMore;
            setFetchedOptions((prev) => ({ ...prev, [columnKey]: options }));
            setHasMoreOptions((prev) => ({ ...prev, [columnKey]: hasMore }));
          } catch (error) {
            console.error(`Failed to fetch options for ${columnKey}:`, error);
          }
        }
      }
    };

    void fetchOptionsForColumns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, filterableColumns]);
  // Note: fetchedOptions intentionally excluded from deps to avoid infinite loop

  // Handle loading more options for a specific column
  const handleLoadMoreOptions = async (columnKey: string) => {
    const column = filterableColumns.find((col) => col.key === columnKey);
    if (!column?.fetchFilterOptions || loadingOptions[columnKey] || !hasMoreOptions[columnKey]) {
      return;
    }

    setLoadingOptions((prev) => ({ ...prev, [columnKey]: true }));
    try {
      const currentOptions = fetchedOptions[columnKey] ?? [];
      const result = await column.fetchFilterOptions(currentOptions.length);
      const newOptions = Array.isArray(result) ? result : result.values;
      const hasMore = Array.isArray(result) ? false : result.hasMore;
      
      setFetchedOptions((prev) => ({
        ...prev,
        [columnKey]: [...currentOptions, ...newOptions],
      }));
      setHasMoreOptions((prev) => ({ ...prev, [columnKey]: hasMore }));
    } catch (error) {
      console.error(`Failed to load more options for ${columnKey}:`, error);
    } finally {
      setLoadingOptions((prev) => ({ ...prev, [columnKey]: false }));
    }
  };

  // Get columns that don't have filters yet (for "Add Filter" dropdown)
  const availableColumns = filterableColumns;

  const handleAddFilter = () => {
    if (!selectedColumn) return;

    const column = filterableColumns.find((col) => col.key === selectedColumn);
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
        initialFilter = { operator: 'equals' as const, type: 'number' as const, value: 0 };
        break;
      }
      case 'date': {
        initialFilter = { operator: 'equals' as const, type: 'date' as const, value: '' };
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
    setExpandedFilters(new Set([selectedColumn, ...expandedFilters]));
    setSelectedColumn('');
  };

  const handleRemoveFilter = (columnKey: string) => {
    const newFilters = { ...filters };
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete newFilters[columnKey];
    onFiltersChange(newFilters);

    // Remove from expanded set
    const newExpanded = new Set(expandedFilters);
    newExpanded.delete(columnKey);
    setExpandedFilters(newExpanded);
  };

  const handleFilterChange = ({ columnKey, filter }: { columnKey: string; filter: typeof filters[string] }) => {
    const newFilters = { ...filters, [columnKey]: filter };
    onFiltersChange(newFilters);
  };

  const handleClearAll = () => {
    onFiltersChange({});
    setExpandedFilters(new Set());
  };

  const toggleFilterExpanded = (columnKey: string) => {
    const newExpanded = new Set(expandedFilters);
    if (newExpanded.has(columnKey)) {
      newExpanded.delete(columnKey);
    } else {
      newExpanded.add(columnKey);
    }
    setExpandedFilters(newExpanded);
  };

  const filterEntries = Object.entries(filters);
  const hasFilters = filterEntries.length > 0;

  return (
    <div {...stylex.props(styles.container)} {...props}>

      {/* Add Filter Section */}
      <div {...stylex.props(styles.addSection)}>
        <h3 {...stylex.props(styles.header)}>Add Filter</h3>
        <select
          {...stylex.props(styles.select)}
          onChange={(e) => {
            setSelectedColumn(e.target.value);
          }}
          value={selectedColumn}
        >
          <option value=''>Select a column...</option>
          {availableColumns.map((col) => {
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

      {/* Active Filters List */}
      <div {...stylex.props(styles.filtersListContainer)}>
        <h3 {...stylex.props(styles.header)}>Active Filters</h3>
        {hasFilters ? (
          <div {...stylex.props(styles.filtersList)}>
            {filterEntries.map(([columnKey, filter]) => {
              const column = filterableColumns.find((col) => col.key === columnKey);
              if (!column) return;

              const isExpanded = expandedFilters.has(columnKey);
              const isValid = validateFilter(filter);

              return (
                <div
                  key={columnKey}
                  {...stylex.props(styles.filterItem)}
                  data-testid={`filter-item-${columnKey}`}
                >
                  <div {...stylex.props(styles.filterItemHeader)}>
                    <button
                      {...stylex.props(styles.filterToggle)}
                      onClick={() => {
                        toggleFilterExpanded(columnKey);
                      }}
                      type='button'
                    >
                      <span {...stylex.props(styles.filterToggleIcon)}>
                        {isExpanded ? '▼' : '▶'}
                      </span>
                      <span {...stylex.props(styles.filterItemLabel)}>
                        {column.label}
                        {!isValid && (
                          <span {...stylex.props(styles.invalidBadge)}>
                            {' '}
                            ⚠️ Invalid
                          </span>
                        )}
                      </span>
                    </button>
                    <Button
                      aria-label={`Remove ${column.label} filter`}
                      color='ghost'
                      icon={<MenuCloseIcon size={16} />}
                      onClick={() => {
                        handleRemoveFilter(columnKey);
                      }}
                      size='mini'
                      width='auto'
                    />
                  </div>
                  {isExpanded && (
                    <div {...stylex.props(styles.filterItemContent)}>
                      {(() => {
                        const effectiveOptions = fetchedOptions[columnKey] ?? column.filterOptions;
                        return (
                          <FilterEditor
                            column={column}
                            filter={filter}
                            filterOptions={effectiveOptions}
                            hasMore={hasMoreOptions[columnKey] ?? false}
                            isLoadingOptions={loadingOptions[columnKey] ?? false}
                            onChange={(newFilter) => {
                              if (newFilter) {
                                handleFilterChange({ columnKey, filter: newFilter });
                              }
                            }}
                            onLoadMoreOptions={
                              column.fetchFilterOptions && hasMoreOptions[columnKey]
                                ? () => {
                                    void handleLoadMoreOptions(columnKey);
                                  }
                                : undefined
                            }
                          />
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p {...stylex.props(styles.emptyState)}>
            No filters applied. Add a filter above to start filtering.
          </p>
        )}
      </div>
            {/* Clear All Filters Section */}
      {hasFilters && (
        <div {...stylex.props(styles.clearSection)}>
          <Button
            color='outline'
            onClick={handleClearAll}
            size='sm'
            width='full'
          >
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );
};

FiltersSection.displayName = 'FiltersSection';
