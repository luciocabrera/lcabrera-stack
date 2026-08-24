import * as stylex from '@stylexjs/stylex';

import { InfoBox } from '#ui/components/InfoBox';
import { SidePanelSectionHeader } from '#ui/components/SidePanel';

import type { ActiveFiltersListProps } from './ActiveFiltersList.types';

import { useGetColumnFilters } from '../../TableDrawerContext/selectors';
import { FiltersSectionToolbar } from '../FiltersSectionToolbar';
import { styles } from './ActiveFiltersList.stylex';
import { FilterItem } from './FilterItem';

export const ActiveFiltersList = ({
  isBusy = false,
}: ActiveFiltersListProps) => {
  const filters = useGetColumnFilters();

  const filterKeys = Object.keys(filters);
  const hasFilters = filterKeys.length > 0;

  return (
    <div {...stylex.props(styles.container)}>
      <SidePanelSectionHeader
        title={`Active Filters (${filterKeys.length})`}
        toolbar={<FiltersSectionToolbar isBusy={isBusy} variant='toolbar' />}
      />
      {hasFilters ? (
        <div {...stylex.props(styles.filtersList)}>
          {filterKeys.map((columnKey) => (
            <FilterItem columnKey={columnKey} isBusy={isBusy} key={columnKey} />
          ))}
        </div>
      ) : (
        <InfoBox>
          No filters applied. Add a filter above to start filtering.
        </InfoBox>
      )}
    </div>
  );
};
