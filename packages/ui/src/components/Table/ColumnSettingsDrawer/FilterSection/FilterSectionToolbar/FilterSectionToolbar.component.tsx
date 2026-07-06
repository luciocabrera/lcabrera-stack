import { ClearResetToolbarButtons } from '@repo/ui/components/Table/ColumnSettingsDrawer/ClearResetToolbarButtons/ClearResetToolbarButtons.component';
import * as stylex from '@stylexjs/stylex';

import type { FilterSectionToolbarProps } from './FilterSectionToolbar.types';

import {
  useResetColumnFilter,
  useSetColumnFilter,
} from '../../ColumnDrawerContext/actions';
import { useGetColumnFilter } from '../../ColumnDrawerContext/selectors';
import { styles } from './FilterSectionToolbar.stylex';

const FILTER_TOOLBAR = {
  clear: { label: 'Clear Filter' },
  reset: { label: 'Reset Filter' },
} as const;

export const FilterSectionToolbar = ({
  isBusy = false,
  variant = 'footer',
}: FilterSectionToolbarProps) => {
  const columnFilter = useGetColumnFilter();

  const setColumnFilter = useSetColumnFilter();
  const resetColumnFilter = useResetColumnFilter();

  const hasFilter = columnFilter !== undefined;

  const handleClear = () => {
    setColumnFilter();
  };

  return (
    <div
      {...stylex.props(
        variant === 'toolbar' ? styles.toolbar : styles.container,
      )}
    >
      <ClearResetToolbarButtons
        clearLabel={FILTER_TOOLBAR.clear.label}
        hasValue={hasFilter}
        isBusy={isBusy}
        onClear={handleClear}
        onReset={resetColumnFilter}
        resetLabel={FILTER_TOOLBAR.reset.label}
        variant={variant}
      />
    </div>
  );
};
