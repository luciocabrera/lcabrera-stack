import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';
import { MenuCloseIcon } from '@/components/Icons';
import { InfoBox } from '@/components/InfoBox';
import { useGetNormalizedColumns } from '@/components/Table/contexts/TableConfig/columns/selectors';
import { FilterInputs } from '@/components/Table/filters/FilterInputs/FilterInputs.component';

import type { ActiveFiltersListProps } from './ActiveFiltersList.types';

import { useSetColumnFilters } from '../../TableDrawerContext/actions';
import { useGetColumnFilters } from '../../TableDrawerContext/selectors';
import { FiltersSectionFooter } from '../FiltersSectionFooter';
import { validateFilter } from '../validateFilter.util';
import { styles } from './ActiveFiltersList.stylex';

export const ActiveFiltersList = ({
  expandedFilters,
  onExpandedFiltersChange,
}: ActiveFiltersListProps) => {
  // === SELECTORS (subscribe to state) ===
  const filters = useGetColumnFilters();
  const normalizedColumns = useGetNormalizedColumns();

  // === ACTIONS (get mutation functions) ===
  const onFiltersChange = useSetColumnFilters();
  const filterEntries = Object.entries(filters);
  const hasFilters = filterEntries.length > 0;

  const toggleFilterExpanded = (columnKey: string) => {
    const newExpanded = new Set(expandedFilters);
    if (newExpanded.has(columnKey)) {
      newExpanded.delete(columnKey);
    } else {
      newExpanded.add(columnKey);
    }
    onExpandedFiltersChange(newExpanded);
  };

  const handleRemoveFilter = (columnKey: string) => {
    const newFilters = { ...filters };
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete newFilters[columnKey];
    onFiltersChange(newFilters);

    // Remove from expanded set
    const newExpanded = new Set(expandedFilters);
    newExpanded.delete(columnKey);
    onExpandedFiltersChange(newExpanded);
  };

  const handleFilterChange = ({
    columnKey,
    filter,
  }: {
    columnKey: string;
    filter: (typeof filters)[string];
  }) => {
    const newFilters = { ...filters, [columnKey]: filter };
    onFiltersChange(newFilters);
  };

  const handleToggle = ({
    columnKey,
    filter,
  }: {
    columnKey: string;
    filter?: (typeof filters)[string];
  }) => {
    if (filter) {
      handleFilterChange({
        columnKey,
        filter,
      });
    } else {
      // undefined means "clear filter" (e.g. boolean "All" selection)
      handleRemoveFilter(columnKey);
    }
  };

  return (
    <div {...stylex.props(styles.container)}>
      <div {...stylex.props(styles.headerRow)}>
        <h3 {...stylex.props(styles.headerTitle)}>
          Active Filters ({filterEntries.length})
        </h3>
        <FiltersSectionFooter variant='toolbar' />
      </div>
      {hasFilters ? (
        <div {...stylex.props(styles.filtersList)}>
          {filterEntries.map(([columnKey, filter]) => {
            const column = normalizedColumns[columnKey];
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
                    <FilterInputs
                      columnKey={columnKey}
                      filter={filter}
                      onChange={(newFilter) => {
                        handleToggle({ columnKey, filter: newFilter });
                      }}
                    />
                    {/* <FilterSectionBody
                      columnKey={columnKey}
                      filter={filter}
                      onChange={(newFilter) => {
                        if (newFilter) {
                          handleFilterChange({
                            columnKey,
                            filter: newFilter,
                          });
                        } else {
                          // undefined means "clear filter" (e.g. boolean "All" selection)
                          handleRemoveFilter(columnKey);
                        }
                      }}
                    /> */}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <InfoBox>
          No filters applied. Add a filter above to start filtering.
        </InfoBox>
      )}
    </div>
  );
};
