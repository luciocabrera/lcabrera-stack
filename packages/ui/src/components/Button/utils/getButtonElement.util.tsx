import * as stylex from '@stylexjs/stylex';

import type { ButtonProps } from '../Button.types';

import { buttonStyles } from '../Button.stylex';

export type ButtonElementArgs = Omit<
  ButtonProps,
  'tooltipContent' | 'tooltipPlacement'
>;
export const getButtonElement = ({
  children,
  customStylex,
  icon,
  isBusy = false,
  isDisabled = false,
  isIconOnly = false,
  orientation = 'vertical',
  size = 'sm',
  type = 'button',
  variant = 'outline',
  ...rest
}: ButtonElementArgs) => {
  const isPrimary = variant === 'primary';

  return (
    <button
      data-testid='button'
      disabled={isDisabled || isBusy}
      {...rest}
      type={type}
      {...stylex.props(
        buttonStyles.base,
        buttonStyles.orientation[orientation],
        buttonStyles.size[size],
        buttonStyles.variant[variant],
        isIconOnly && buttonStyles.iconOnly,
        isBusy && buttonStyles.busyState,
        customStylex,
        isPrimary && buttonStyles.overlayParent,
      )}
    >
      {Boolean(isBusy) && (
        <span {...stylex.props(buttonStyles.busyOverlay)}>
          <span {...stylex.props(buttonStyles.busyWave)} />
        </span>
      )}
      {Boolean(icon) && (
        <span {...stylex.props(buttonStyles.icon)}>{icon}</span>
      )}
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
        />
      )}
    </button>
  );
};
