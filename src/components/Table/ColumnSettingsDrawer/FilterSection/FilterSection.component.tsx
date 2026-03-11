import * as stylex from '@stylexjs/stylex';

import type { FilterSectionProps } from './FilterSection.types';

import { FilterInputs } from '../../filters/FilterInputs';
import { useSetColumnFilter } from '../ColumnDrawerContext/actions';
import { useGetColumnFilter } from '../ColumnDrawerContext/selectors';
import { styles } from './FilterSection.stylex';
import { FilterSectionToolbar } from './FilterSectionToolbar';

export const FilterSection = <TData,>({
  columnKey,
}: FilterSectionProps<TData>) => {
  const columnFilter = useGetColumnFilter();
  const setColumnFilter = useSetColumnFilter();

  return (
    <div {...stylex.props(styles.container)}>
      <div {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.headerRow)}>
          <h3 {...stylex.props(styles.headerTitle)}>Column Filter</h3>
          <FilterSectionToolbar variant='toolbar' />
        </div>
        <FilterInputs
          columnKey={columnKey}
          filter={columnFilter}
          onChange={setColumnFilter}
          shouldFillHeight
        />
      </div>
      <FilterSectionToolbar />
    </div>
  );
};
