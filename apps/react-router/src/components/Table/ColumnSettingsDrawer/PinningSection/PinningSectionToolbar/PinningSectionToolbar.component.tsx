import * as stylex from '@stylexjs/stylex';

import { Button } from '@/components/Button';
import { EraserIcon, RefreshIcon } from '@/components/Icons';
import { ICON_SIZE_MD, ICON_SIZE_SM } from '@/design-system/constants';

import type { PinningSectionToolbarProps } from './PinningSectionToolbar.types.ts';

import {
  useResetColumnPinning,
  useSetColumnPinning,
} from '../../ColumnDrawerContext/actions/index.ts';
import { useGetColumnPinning } from '../../ColumnDrawerContext/selectors/index.ts';
import { styles } from './PinningSectionToolbar.stylex.ts';

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
        aria-label='Clear Pinning'
        color={buttonColor}
        icon={<EraserIcon size={iconSize} />}
        isDisabled={!hasPinning}
        onClick={handleClear}
        size={buttonSize}
        width={buttonWidth}
      >
        {!isToolbar && 'Clear Pinning'}
      </Button>
      <Button
        aria-label='Reset Pinning'
        color={buttonColor}
        icon={<RefreshIcon size={iconSize} />}
        onClick={resetColumnPinning}
        size={buttonSize}
        width={buttonWidth}
      >
        {!isToolbar && 'Reset Pinning'}
      </Button>
    </div>
  );
};
