import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';
import { EraserIcon, RefreshIcon } from '@/components/Icons';
import { ICON_SIZE_MD } from '@/design-system/constants';
import { drawerSectionStyles } from '@/design-system/tokens/drawerSection.stylex';

import type { FilterSectionProps } from './FilterSection.types';

import { FilterInputs } from '../../filters/FilterInputs';
import {
  useResetColumnFilter,
  useSetColumnFilter,
} from '../ColumnDrawerContext/actions';
import { useGetColumnFilter } from '../ColumnDrawerContext/selectors';
import { styles } from './FilterSection.stylex';

export const FilterSection = <TData,>({
  columnKey,
}: FilterSectionProps<TData>) => {
  const columnFilter = useGetColumnFilter();
  const setColumnFilter = useSetColumnFilter();
  const resetColumnFilter = useResetColumnFilter();

  const hasFilter = columnFilter !== undefined;

  const handleClear = () => {
    setColumnFilter(undefined);
  };

  return (
    <div {...stylex.props(styles.container)}>
      <FilterInputs
        columnKey={columnKey}
        filter={columnFilter}
        onChange={setColumnFilter}
        shouldFillHeight
      />
      <div {...stylex.props(drawerSectionStyles.resetSection)}>
        <Button
          color='outline'
          icon={<EraserIcon size={ICON_SIZE_MD} />}
          isDisabled={!hasFilter}
          onClick={handleClear}
          size='sm'
          width='full'
        >
          Clear Filter
        </Button>
        <Button
          color='outline'
          icon={<RefreshIcon size={ICON_SIZE_MD} />}
          onClick={resetColumnFilter}
          size='sm'
          width='full'
        >
          Reset Filter
        </Button>
      </div>
    </div>
  );
};
