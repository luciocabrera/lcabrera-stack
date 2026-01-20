import * as stylex from '@stylexjs/stylex';
import { useState } from 'react';

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

  // Filter to only filterable columns
  const filterableColumns = columns.filter((col) => col.isFilterable !== false);

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
        // Check if column has filter options
        initialFilter = column.filterOptions && column.filterOptions.length > 0
          ? { type: 'multiSelect' as const, values: [] }
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
                    />
                  </div>
                  {isExpanded && (
                    <div {...stylex.props(styles.filterItemContent)}>
                      <FilterEditor
                        column={column}
                        filter={filter}
                        filterOptions={column.filterOptions}
                        onChange={(newFilter) => {
                          if (newFilter) {
                            handleFilterChange({ columnKey, filter: newFilter });
                          }
                        }}
                      />
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
    </div>
  );
};

FiltersSection.displayName = 'FiltersSection';
