import * as stylex from '@stylexjs/stylex';

import {
  SidePanelSectionHeader,
  SidePanelSectionMain,
} from '@/components/SidePanel';

import type { FilterSectionProps } from './FilterSection.types';

import { FilterInputs } from '../../filters/FilterInputs';
import { useSetColumnFilter } from '../ColumnDrawerContext/actions';
import { useGetColumnFilter } from '../ColumnDrawerContext/selectors';
import { styles } from './FilterSection.stylex';
import { FilterSectionToolbar } from './FilterSectionToolbar';

export const FilterSection = <TData,>({
  columnKey,
  isBussy = false,
}: FilterSectionProps<TData>) => {
  const columnFilter = useGetColumnFilter();
  const setColumnFilter = useSetColumnFilter();

  return (
    <SidePanelSectionMain>
      <div {...stylex.props(styles.section)}>
        <SidePanelSectionHeader
          title='Column Filter'
          toolbar={<FilterSectionToolbar isBussy={isBussy} variant='toolbar' />}
        />
        <FilterInputs
          columnKey={columnKey}
          filter={columnFilter}
          onChange={setColumnFilter}
          shouldFillHeight
        />
      </div>
      <FilterSectionToolbar isBussy={isBussy} />
    </SidePanelSectionMain>
  );
};
