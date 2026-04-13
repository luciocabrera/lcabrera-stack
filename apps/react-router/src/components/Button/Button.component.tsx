import * as stylex from '@stylexjs/stylex';

import type { ButtonProps } from './Button.types.ts';

import { Tooltip } from '../Tooltip/index.ts';
import { buttonStyles } from './Button.stylex.ts';

export const Button = ({
  children,
  color = 'primary',
  customStylex,
  icon,
  isDisabled = false,
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
      disabled={isDisabled}
      {...rest}
      type={type}
      {...stylex.props(
        buttonStyles.base,
        buttonStyles.orientation[orientation],
        buttonStyles.size[size],
        buttonStyles.color[color],
        buttonStyles.style[variant],
        buttonStyles.width[width],
        customStylex,
      )}
    >
      {icon && <span {...stylex.props(buttonStyles.icon)}>{icon}</span>}
      <span {...stylex.props(buttonStyles.label)}>{children}</span>
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
