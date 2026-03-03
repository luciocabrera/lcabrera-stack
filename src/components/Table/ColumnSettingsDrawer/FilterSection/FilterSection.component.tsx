import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';
import { drawerSectionStyles } from '@/design-system/tokens/drawerSection.stylex';

import type { FilterSectionProps } from './FilterSection.types';

import { FilterInputs } from '../../filters/FilterInputs';
import { useSetColumnFilter } from '../ColumnDrawerContext/columns/actions';
import { useGetColumnFilter } from '../ColumnDrawerContext/columns/selectors';
import { styles } from './FilterSection.stylex';

export const FilterSection = <TData,>({
  columnKey,
}: FilterSectionProps<TData>) => {
  const columnFilter = useGetColumnFilter();
  const setColumnFilter = useSetColumnFilter();

  const handleChange = (
    newFilter: Parameters<typeof FilterInputs>[0]['filter'],
  ) => {
    setColumnFilter(newFilter);
  };

  const handleReset = () => {
    setColumnFilter(undefined);
  };

  return (
    <div {...stylex.props(styles.container)}>
      <FilterInputs
        columnKey={columnKey}
        filter={columnFilter}
        onChange={handleChange}
        shouldFillHeight
      />
      <div {...stylex.props(drawerSectionStyles.resetSection)}>
        <Button color='outline' onClick={handleReset} size='sm' width='full'>
          Reset Filter
        </Button>
      </div>
    </div>
  );
};
