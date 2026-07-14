import * as stylex from '@stylexjs/stylex';

import type { ButtonProps } from './Button.types';

import { Tooltip } from '../Tooltip';
import { buttonStyles } from './Button.stylex';

export const Button = ({
  children,
  color,
  customStylex,
  icon,
  isBusy = false,
  isDisabled = false,
  isIconOnly = false,
  orientation = 'vertical',
  size = 'md',
  tooltipContent,
  tooltipPlacement = 'top',
  type = 'button',
  variant,
  ...rest
}: ButtonProps) => {
  const resolvedVariant = variant ?? color ?? 'primary';
  const isPrimary = resolvedVariant === 'primary';

  const button = (
    <button
      data-testid='button'
      disabled={isDisabled || isBusy}
      {...rest}
      type={type}
      {...stylex.props(
        buttonStyles.base,
        buttonStyles.orientation[orientation],
        buttonStyles.size[size],
        buttonStyles.variant[resolvedVariant],
        isIconOnly && buttonStyles.iconOnly,
        isBusy && buttonStyles.busyState,
        customStylex,
        isPrimary && buttonStyles.overlayParent,
      )}
    >
      {isBusy && (
        <span {...stylex.props(buttonStyles.busyOverlay)}>
          <span {...stylex.props(buttonStyles.busyWave)} />
        </span>
      )}
      {icon && <span {...stylex.props(buttonStyles.icon)}>{icon}</span>}
      <span
        {...stylex.props(
          buttonStyles.label,
          isIconOnly && buttonStyles.labelHidden,
        )}
      >
        {children}
      </span>
      {isPrimary && (
        <div
          {...stylex.props(
            buttonStyles.overlay,
            buttonStyles.linear,
            buttonStyles.overlayOverwrite,
          )}
        ></div>
      )}
    </button>
  );

  if (tooltipContent) {
    return (
      <Tooltip content={tooltipContent} placement={tooltipPlacement}>
        {button}
      </Tooltip>
    );
  }

  return button;
};
