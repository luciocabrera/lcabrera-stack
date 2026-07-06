import { InfoBox } from '@repo/ui/components/InfoBox';
import { SidePanelSectionHeader } from '@repo/ui/components/SidePanel';
import { useGetNormalizedColumns } from '@repo/ui/components/Table/contexts/TableConfig/columns/selectors';
import * as stylex from '@stylexjs/stylex';

import type {
  ActiveFiltersListProps,
  HandleFilterChangeArgs,
  HandleToggleArgs,
} from './ActiveFiltersList.types';

import { useSetColumnFilters } from '../../TableDrawerContext/actions';
import { useGetColumnFilters } from '../../TableDrawerContext/selectors';
import { FiltersSectionToolbar } from '../FiltersSectionToolbar';
import { styles } from './ActiveFiltersList.stylex';
import { FilterItem } from './FilterItem';

export const ActiveFiltersList = ({
  expandedFilters,
  isBusy = false,
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
            isBusy={isBusy}
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
            return (
              <FilterItem
                column={column}
                columnKey={columnKey}
                expandedFilters={expandedFilters}
                filter={filter}
                isBusy={isBusy}
                key={columnKey}
                onRemove={handleRemoveFilter}
                onToggle={handleToggle}
                onToggleExpanded={toggleFilterExpanded}
              />
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
