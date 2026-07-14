import { Button } from '@repo/ui/components/Button';
import { EraserIcon, RefreshIcon } from '@repo/ui/components/Icons';
import { ICON_SIZE_MD, ICON_SIZE_SM } from '@repo/ui/design-system/constants';

import type { ClearResetToolbarButtonsProps } from './ClearResetToolbarButtons.types';

export const ClearResetToolbarButtons = ({
  clearLabel,
  hasValue,
  isBusy = false,
  onClear,
  onReset,
  resetLabel,
  variant,
}: ClearResetToolbarButtonsProps) => {
  const isToolbar = variant === 'toolbar';
  const buttonVariant = isToolbar ? 'ghost' : 'outline';
  const buttonSize = isToolbar ? 'mini' : 'sm';
  const iconSize = isToolbar ? ICON_SIZE_SM : ICON_SIZE_MD;

  return (
    <>
      <Button
        aria-label={clearLabel}
        icon={<EraserIcon size={iconSize} />}
        isBusy={isBusy}
        isDisabled={!hasValue}
        onClick={onClear}
        size={buttonSize}
        tooltipContent={isToolbar ? clearLabel : undefined}
        variant={buttonVariant}
      >
        {!isToolbar && clearLabel}
      </Button>
      <Button
        aria-label={resetLabel}
        icon={<RefreshIcon size={iconSize} />}
        isBusy={isBusy}
        onClick={onReset}
        size={buttonSize}
        tooltipContent={isToolbar ? resetLabel : undefined}
        variant={buttonVariant}
      >
        {!isToolbar && resetLabel}
      </Button>
    </>
  );
};
