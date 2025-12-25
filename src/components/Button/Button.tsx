import * as stylex from '@stylexjs/stylex';

import type { ButtonProps } from './Button.types';

import { buttonStyles } from './Button.stylex';

export const Button = ({
  children,
  color = 'primary',
  isDisabled = false,
  size = 'md',
  type = 'button',
  variant = 'solid',
  width = 'auto',
  ...rest
}: ButtonProps) => {
  return (
    <button
      data-testid="button"
      disabled={isDisabled}
      {...rest}
      type={type}
      {...stylex.props(
        buttonStyles.base,
        buttonStyles.rippleBase,
        buttonStyles.ripple[color],
        buttonStyles.size[size],
        buttonStyles.color[color],
        buttonStyles.style[variant],
        buttonStyles.width[width],
      )}
    >
      {children}
    </button>
  );
};
