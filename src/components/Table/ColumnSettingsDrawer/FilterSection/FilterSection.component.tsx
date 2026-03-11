import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';
import { EraserIcon, RefreshIcon } from '@/components/Icons';
import { ICON_SIZE_MD, ICON_SIZE_SM } from '@/design-system/constants';

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
      <div {...stylex.props(styles.section)}>
        <div {...stylex.props(styles.headerRow)}>
          <h3 {...stylex.props(styles.headerTitle)}>Column Filter</h3>
          <div {...stylex.props(styles.headerToolbar)}>
            <Button
              aria-label='Clear Filter'
              color='ghost'
              icon={<EraserIcon size={ICON_SIZE_SM} />}
              isDisabled={!hasFilter}
              onClick={handleClear}
              size='mini'
              width='auto'
            />
            <Button
              aria-label='Reset Filter'
              color='ghost'
              icon={<RefreshIcon size={ICON_SIZE_SM} />}
              onClick={resetColumnFilter}
              size='mini'
              width='auto'
            />
          </div>
        </div>
        <FilterInputs
          columnKey={columnKey}
          filter={columnFilter}
          onChange={setColumnFilter}
          shouldFillHeight
        />
      </div>
      <div {...stylex.props(styles.resetSection)}>
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
