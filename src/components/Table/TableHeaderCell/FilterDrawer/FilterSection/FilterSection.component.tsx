import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';
import { drawerSectionStyles } from '@/design-system/tokens/drawerSection.stylex';

import type { FilterSectionProps } from './FilterSection.types';

import { FilterInputs } from '../../../filters/FilterInputs';
import { styles } from './FilterSection.stylex';

export const FilterSection = <TData,>({
  columnKey,
  filter,
  onChange,
  onReset,
}: FilterSectionProps<TData>) => {
  return (
    <div {...stylex.props(styles.container)}>
      <FilterInputs
        columnKey={columnKey}
        filter={filter}
        onChange={onChange}
        shouldFillHeight
      />
      <div {...stylex.props(drawerSectionStyles.resetSection)}>
        <Button color='outline' onClick={onReset} size='sm' width='full'>
          Reset Filter
        </Button>
      </div>
    </div>
  );
};
