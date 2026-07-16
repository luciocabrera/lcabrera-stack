import { ClearResetToolbarButtons } from '@repo/ui/components/Table/ColumnSettingsDrawer/ClearResetToolbarButtons/ClearResetToolbarButtons.component';
import * as stylex from '@stylexjs/stylex';

import type { PinningSectionToolbarProps } from './PinningSectionToolbar.types';

import {
  useResetColumnPinning,
  useSetColumnPinning,
} from '../../ColumnDrawerContext/actions';
import { useGetColumnPinning } from '../../ColumnDrawerContext/selectors';
import { styles } from './PinningSectionToolbar.stylex';

const PINNING_TOOLBAR = {
  clear: { label: 'Clear Pinning' },
  reset: { label: 'Reset Pinning' },
} as const;

export const PinningSectionToolbar = ({
  isBusy = false,
  variant = 'footer',
}: PinningSectionToolbarProps) => {
  const columnPinning = useGetColumnPinning();
  const setColumnPinning = useSetColumnPinning();
  const resetColumnPinning = useResetColumnPinning();

  const hasPinning = columnPinning !== undefined;

  const handleClear = () => {
    setColumnPinning();
  };

  return (
    <div
      {...stylex.props(
        variant === 'toolbar' ? styles.toolbar : styles.container,
      )}
    >
      <ClearResetToolbarButtons
        clearLabel={PINNING_TOOLBAR.clear.label}
        hasValue={hasPinning}
        isBusy={isBusy}
        onClear={handleClear}
        onReset={resetColumnPinning}
        resetLabel={PINNING_TOOLBAR.reset.label}
        variant={variant}
      />
    </div>
  );
};
