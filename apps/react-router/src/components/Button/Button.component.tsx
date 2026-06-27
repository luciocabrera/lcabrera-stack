import * as stylex from '@stylexjs/stylex';

import type { ButtonProps } from './Button.types';

import { Tooltip } from '../Tooltip';
import { buttonStyles } from './Button.stylex';

export const Button = ({
  children,
  color = 'primary',
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
  variant = 'solid',
  width = 'full',
  ...rest
}: ButtonProps) => {
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
        buttonStyles.color[color],
        buttonStyles.style[variant],
        buttonStyles.width[width],
        isIconOnly && buttonStyles.iconOnly,
        isBusy && buttonStyles.busyState,
        customStylex,
        color === 'primary' && buttonStyles.overlayParent,
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
      {color === 'primary' && (
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
