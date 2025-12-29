import * as stylex from '@stylexjs/stylex';

import type { ButtonProps } from './Button.types';

import { buttonStyles } from './Button.stylex';

export const Button = ({
  children,
  color = 'primary',
  customStylex,
  isDisabled = false,
  size = 'md',
  type = 'button',
  variant = 'solid',
  width = 'auto',
  ...rest
}: ButtonProps) => {
  const hasRipple = color === 'ghost' || color === 'outline';

  return (
    <button
      data-testid='button'
      disabled={isDisabled}
      {...rest}
      type={type}
      {...stylex.props(
        buttonStyles.base,
        hasRipple && buttonStyles.rippleBase,
        hasRipple && buttonStyles.ripple[color],
        buttonStyles.size[size],
        buttonStyles.color[color],
        buttonStyles.style[variant],
        buttonStyles.width[width],
        customStylex,
      )}
    >
      {children}
    </button>
  );
};
