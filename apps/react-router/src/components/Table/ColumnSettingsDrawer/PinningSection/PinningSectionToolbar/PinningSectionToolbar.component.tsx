import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';
import { EraserIcon, RefreshIcon } from '@/components/Icons';
import { ICON_SIZE_MD, ICON_SIZE_SM } from '@/design-system/constants';

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
  variant = 'footer',
}: PinningSectionToolbarProps) => {
  const columnPinning = useGetColumnPinning();
  const setColumnPinning = useSetColumnPinning();
  const resetColumnPinning = useResetColumnPinning();

  const hasPinning = columnPinning !== undefined;
  const isToolbar = variant === 'toolbar';
  const buttonColor = isToolbar ? 'ghost' : 'outline';
  const buttonSize = isToolbar ? 'mini' : 'sm';
  const buttonWidth = isToolbar ? 'auto' : 'full';
  const iconSize = isToolbar ? ICON_SIZE_SM : ICON_SIZE_MD;

  const handleClear = () => {
    setColumnPinning(undefined);
  };

  return (
    <div {...stylex.props(isToolbar ? styles.toolbar : styles.container)}>
      <Button
        aria-label={PINNING_TOOLBAR.clear.label}
        color={buttonColor}
        icon={<EraserIcon size={iconSize} />}
        isDisabled={!hasPinning}
        onClick={handleClear}
        size={buttonSize}
        width={buttonWidth}
        tooltipContent={isToolbar ? PINNING_TOOLBAR.clear.label : undefined}
      >
        {!isToolbar && PINNING_TOOLBAR.clear.label}
      </Button>
      <Button
        aria-label={PINNING_TOOLBAR.reset.label}
        color={buttonColor}
        icon={<RefreshIcon size={iconSize} />}
        onClick={resetColumnPinning}
        size={buttonSize}
        width={buttonWidth}
        tooltipContent={isToolbar ? PINNING_TOOLBAR.reset.label : undefined}
      >
        {!isToolbar && PINNING_TOOLBAR.reset.label}
      </Button>
    </div>
  );
};
