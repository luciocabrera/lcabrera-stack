import { Button } from '@/components/Button';
import { EraserIcon, RefreshIcon } from '@/components/Icons';
import { ICON_SIZE_MD, ICON_SIZE_SM } from '@/design-system/constants';

import type { ClearResetToolbarButtonsProps } from './ClearResetToolbarButtons.types';

export const ClearResetToolbarButtons = ({
  clearLabel,
  hasValue,
  isBussy = false,
  onClear,
  onReset,
  resetLabel,
  variant,
}: ClearResetToolbarButtonsProps) => {
  const isToolbar = variant === 'toolbar';
  const buttonColor = isToolbar ? 'ghost' : 'outline';
  const buttonSize = isToolbar ? 'mini' : 'sm';
  const buttonWidth = isToolbar ? 'auto' : 'full';
  const iconSize = isToolbar ? ICON_SIZE_SM : ICON_SIZE_MD;

  return (
    <>
      <Button
        aria-label={clearLabel}
        color={buttonColor}
        icon={<EraserIcon size={iconSize} />}
        isBussy={isBussy}
        isDisabled={!hasValue}
        onClick={onClear}
        size={buttonSize}
        tooltipContent={isToolbar ? clearLabel : undefined}
        width={buttonWidth}
      >
        {!isToolbar && clearLabel}
      </Button>
      <Button
        aria-label={resetLabel}
        color={buttonColor}
        icon={<RefreshIcon size={iconSize} />}
        isBussy={isBussy}
        onClick={onReset}
        size={buttonSize}
        tooltipContent={isToolbar ? resetLabel : undefined}
        width={buttonWidth}
      >
        {!isToolbar && resetLabel}
      </Button>
    </>
  );
};
