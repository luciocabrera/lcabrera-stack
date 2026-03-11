import * as stylex from '@stylexjs/stylex';

import {
  SidePanelSection,
  SidePanelSectionHeader,
} from '@/components/SidePanel';

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
      <SidePanelSection>
        <SidePanelSectionHeader
          title='Column Filter'
          toolbar={<FilterSectionToolbar variant='toolbar' />}
        />
        <FilterInputs
          columnKey={columnKey}
          filter={columnFilter}
          onChange={setColumnFilter}
          shouldFillHeight
        />
      </SidePanelSection>
      <FilterSectionToolbar />
    </div>
  );
};
