import * as stylex from '@stylexjs/stylex';

import type { FilterSectionProps } from './FilterSection.types';

import { FilterInputs } from '../../../filters/FilterInputs';
import { styles } from './FilterSection.stylex';

export const FilterSection = <TData,>({
  columnKey,
  filter,
  onChange,
}: FilterSectionProps<TData>) => {
  return (
    <div {...stylex.props(styles.container)}>
      <FilterInputs
        columnKey={columnKey}
        filter={filter}
        onChange={onChange}
        shouldFillHeight
      />
    </div>
  );
};
