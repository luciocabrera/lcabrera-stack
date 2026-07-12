import { InfoBox } from '@repo/ui/components/InfoBox';
import { SidePanelSectionHeader } from '@repo/ui/components/SidePanel';
import { useGetNormalizedColumns } from '@repo/ui/components/Table/contexts/TableConfig/columns/selectors';
import * as stylex from '@stylexjs/stylex';

import type { ActiveFiltersListProps } from './ActiveFiltersList.types';

import { useGetColumnFilters } from '../../TableDrawerContext/selectors';
import { FiltersSectionToolbar } from '../FiltersSectionToolbar';
import { styles } from './ActiveFiltersList.stylex';
import { FilterItem } from './FilterItem';

/**
 * Expandable list of the active drawer filters with the count header and the
 * compact toolbar. Reads the filter store itself; each row is a
 * self-connected FilterItem that owns its own remove/toggle/change wiring.
 */
export const ActiveFiltersList = ({
  isBusy = false,
}: ActiveFiltersListProps) => {
  const filters = useGetColumnFilters();
  const normalizedColumns = useGetNormalizedColumns();

  const filterEntries = Object.entries(filters);
  const hasFilters = filterEntries.length > 0;

  return (
    <div {...stylex.props(styles.container)}>
      <SidePanelSectionHeader
        title={`Active Filters (${filterEntries.length})`}
        toolbar={<FiltersSectionToolbar isBusy={isBusy} variant='toolbar' />}
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
                filter={filter}
                isBusy={isBusy}
                key={columnKey}
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
