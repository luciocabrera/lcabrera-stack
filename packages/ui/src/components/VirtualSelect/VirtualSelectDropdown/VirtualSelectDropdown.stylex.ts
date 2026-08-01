import {
  borderRadius,
  shadows,
  spacing,
  zIndex,
} from '@lcabrera/ui/design-system/tokens/base.stylex';
import { colors } from '@lcabrera/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  dropdownBase: {
    borderColor: colors.borderPrimary,
    borderRadius: borderRadius.md,
    borderStyle: 'none',
    borderWidth: '1px',
    backdropFilter: 'blur(25px)',
    backgroundColor: 'transparent',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    marginTop: spacing.sm,
    maxWidth: '100%',
    minWidth: 0,
    width: '100%',
  },
  /**
   * Floating (trigger-opened) dropdown. `position: fixed` plus the top layer,
   * because an absolutely positioned list is clipped by any scrolling ancestor
   * — see `useVirtualSelectDropdownPosition`, which supplies the coordinates.
   * Most of this block is undoing the `[popover]` UA stylesheet, which sets
   * `inset: 0`, `margin: auto`, `padding: .25em`, a solid border, system
   * colors and `overflow: auto`.
   */
  dropdownFloating: {
    inset: 'auto',
    borderStyle: 'none',
    overflow: 'visible',
    boxShadow: shadows.lg,
    color: 'inherit',
    position: 'fixed',
    zIndex: zIndex.dropdown,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    marginTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 0,
  },
  /** Viewport coordinates; the gap to the trigger is baked into `top`. */
  dropdownAt: (left: number, top: number, width: number) => ({
    left,
    top,
    width,
  }),
  /** Held back for the one frame between mount and the first measurement. */
  dropdownUnplaced: {
    visibility: 'hidden',
  },
  dropdownStatic: {
    position: 'relative',
  },
  dropdownStaticFill: {
    flex: '1',
    position: 'relative',
    minHeight: 0,
  },
});
