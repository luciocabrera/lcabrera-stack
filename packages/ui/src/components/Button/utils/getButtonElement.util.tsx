import * as stylex from '@stylexjs/stylex';

import type { ButtonProps } from '../Button.types';

import { buttonStyles } from '../Button.stylex';

/**
 * Args for {@link getButtonElement} — every {@link ButtonProps} field except the
 * tooltip concerns, which are owned by the `Button` component itself.
 */
export type ButtonElementArgs = Omit<
  ButtonProps,
  'tooltipContent' | 'tooltipPlacement'
>;
/**
 * Builds the native `<button>` element for `Button`, applying every StyleX
 * variant (color, size, orientation, icon-only, busy/loading shimmer overlay,
 * and the primary-variant gradient overlay).
 *
 * Returns a host `<button>` element rather than a component so that wrappers
 * such as `Tooltip` keep detecting the trigger as a natively interactive
 * element (see `getIsNativeInteractiveElement`), which a component boundary
 * would hide.
 */
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
