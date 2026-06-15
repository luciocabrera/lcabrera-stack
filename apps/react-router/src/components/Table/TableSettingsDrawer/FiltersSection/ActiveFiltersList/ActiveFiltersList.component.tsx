import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';
import { MenuCloseIcon } from '@/components/Icons';
import { InfoBox } from '@/components/InfoBox';
import { SidePanelSectionHeader } from '@/components/SidePanel';
import { useGetNormalizedColumns } from '@/components/Table/contexts/TableConfig/columns/selectors';
import { FilterInputs } from '@/components/Table/filters/FilterInputs';
import { LIST_MAX_HEIGHT } from '@/components/VirtualList/VirtualList.constants';
import { ICON_SIZE_MD } from '@/design-system/constants';

import type {
  ActiveFiltersListProps,
  HandleFilterChangeArgs,
  HandleToggleArgs,
} from './ActiveFiltersList.types';

import { useSetColumnFilters } from '../../TableDrawerContext/actions';
import { useGetColumnFilters } from '../../TableDrawerContext/selectors';
import { FiltersSectionToolbar } from '../FiltersSectionToolbar';
import { validateFilter } from '../validateFilter.util';
import { styles } from './ActiveFiltersList.stylex';

export const ActiveFiltersList = ({
  expandedFilters,
  isBussy = false,
  isCollapseAllDisabled,
  isExpandAllDisabled,
  onCollapseAll,
  onExpandAll,
  onExpandedFiltersChange,
}: ActiveFiltersListProps) => {
  const filters = useGetColumnFilters();
  const normalizedColumns = useGetNormalizedColumns();

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
    const remainingFilters: typeof filters = {};
    for (const [key, value] of Object.entries(filters)) {
      if (key !== columnKey) {
        remainingFilters[key] = value;
      }
    }
    onFiltersChange(remainingFilters);

    // Remove from expanded set
    const newExpanded = new Set(expandedFilters);
    newExpanded.delete(columnKey);
    onExpandedFiltersChange(newExpanded);
  };

  const handleFilterChange = ({
    columnKey,
    filter,
  }: HandleFilterChangeArgs) => {
    const newFilters = { ...filters, [columnKey]: filter };
    onFiltersChange(newFilters);
  };

  const handleToggle = ({ columnKey, filter }: HandleToggleArgs) => {
    if (filter) {
      handleFilterChange({
        columnKey,
        filter,
      });
    } else {
      handleRemoveFilter(columnKey);
    }
  };

  return (
    <div {...stylex.props(styles.container)}>
      <SidePanelSectionHeader
        title={`Active Filters (${filterEntries.length})`}
        toolbar={
          <FiltersSectionToolbar
            isBussy={isBussy}
            isCollapseAllDisabled={isCollapseAllDisabled}
            isExpandAllDisabled={isExpandAllDisabled}
            onCollapseAll={onCollapseAll}
            onExpandAll={onExpandAll}
            variant='toolbar'
          />
        }
      />
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
                {isBussy && (
                  <div {...stylex.props(styles.busyOverlay)}>
                    <div {...stylex.props(styles.busyWave)} />
                  </div>
                )}
                <div {...stylex.props(styles.filterItemHeader)}>
                  <button
                    {...stylex.props(styles.filterToggle)}
                    disabled={isBussy}
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
                    icon={<MenuCloseIcon size={ICON_SIZE_MD} />}
                    isBussy={isBussy}
                    onClick={() => {
                      handleRemoveFilter(columnKey);
                    }}
                    tooltipContent={`Remove ${column.label} filter`}
                    size='mini'
                    width='auto'
                  />
                </div>
                {isExpanded && (
                  <div {...stylex.props(styles.filterItemContent)}>
                    <FilterInputs
                      columnKey={columnKey}
                      filter={filter}
                      listMaxHeight={LIST_MAX_HEIGHT}
                      onChange={(newFilter) => {
                        handleToggle({ columnKey, filter: newFilter });
                      }}
                    />
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
