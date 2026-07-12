import type { ColumnFilter } from '@repo/ui/types/filterOperators.types';

import { FilterInputs } from '@repo/ui/components/Table/filters/FilterInputs';
import { LIST_MAX_HEIGHT } from '@repo/ui/components/VirtualList/VirtualList.constants';
import * as stylex from '@stylexjs/stylex';

import type { FilterItemContentProps } from './FilterItemContent.types';

import { useSetColumnFilters } from '../../../../TableDrawerContext/actions';
import { useGetColumnFilters } from '../../../../TableDrawerContext/selectors';
import { styles } from '../FilterItem.stylex';
import { useRemoveFilterItem } from '../useRemoveFilterItem.hook';

/**
 * Expanded body of one active filter: the type-specific filter inputs.
 * Owns its store wiring: upserts the drawer filter on change and runs the
 * remove flow when the inputs clear it.
 */
export const FilterItemContent = ({ columnKey }: FilterItemContentProps) => {
  const filters = useGetColumnFilters();
  const setColumnFilters = useSetColumnFilters();
  const removeFilterItem = useRemoveFilterItem();

  const handleFilterChange = (newFilter?: ColumnFilter) => {
    if (newFilter) {
      setColumnFilters({ ...filters, [columnKey]: newFilter });
      return;
    }

    removeFilterItem(columnKey);
  };

  return (
    <div {...stylex.props(styles.filterItemContent)}>
      <FilterInputs
        columnKey={columnKey}
        filter={filters[columnKey]}
        listMaxHeight={LIST_MAX_HEIGHT}
        onChange={handleFilterChange}
      />
    </div>
  );
};
