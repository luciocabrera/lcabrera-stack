import { Button } from '@/components/Button';
import { EraserIcon, RefreshIcon } from '@/components/Icons';
import { ICON_SIZE_MD, ICON_SIZE_SM } from '@/design-system/constants';

export type ClearResetToolbarButtonsProps = {
  readonly clearLabel: string;
  readonly hasValue: boolean;
  readonly onClear: () => void;
  readonly onReset: () => void;
  readonly resetLabel: string;
  readonly variant: 'footer' | 'toolbar';
};

export const ClearResetToolbarButtons = ({
  clearLabel,
  hasValue,
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
