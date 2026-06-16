import * as stylex from '@stylexjs/stylex';

import { ClearResetToolbarButtons } from '@/components/Table/ColumnSettingsDrawer/ClearResetToolbarButtons/ClearResetToolbarButtons.component';

import type { SortingSectionToolbarProps } from './SortingSectionToolbar.types';

import {
  useResetColumnSorting,
  useSetColumnSorting,
} from '../../ColumnDrawerContext/actions';
import { useGetColumnSorting } from '../../ColumnDrawerContext/selectors';
import { styles } from './SortingSectionToolbar.stylex';

const SORTING_TOOLBAR = {
  clear: { label: 'Clear Sorting' },
  reset: { label: 'Reset Sorting' },
} as const;

export const SortingSectionToolbar = ({
  isBusy = false,
  variant = 'footer',
}: SortingSectionToolbarProps) => {
  const sortDirection = useGetColumnSorting();
  const setColumnSorting = useSetColumnSorting();
  const resetColumnSorting = useResetColumnSorting();

  const hasSorting = sortDirection !== undefined;

  const handleClear = () => {
    setColumnSorting(undefined);
  };

  return (
    <div
      {...stylex.props(
        variant === 'toolbar' ? styles.toolbar : styles.container,
      )}
    >
      <ClearResetToolbarButtons
        clearLabel={SORTING_TOOLBAR.clear.label}
        hasValue={hasSorting}
        isBusy={isBusy}
        onClear={handleClear}
        onReset={resetColumnSorting}
        resetLabel={SORTING_TOOLBAR.reset.label}
        variant={variant}
      />
    </div>
  );
};
