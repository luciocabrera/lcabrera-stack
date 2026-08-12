import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  shadows,
  spacing,
  zIndex,
} from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

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
   * Surface half of the floating (trigger-opened) dropdown: the elevation, plus
   * everything undoing the `[popover]` UA stylesheet, which sets `margin: auto`,
   * `padding: .25em`, a solid border, system colors and `overflow: auto`.
   *
   * Split from `dropdownFloatingPosition` so the two can sit on opposite sides
   * of the consumer's `customStylex` in the style chain — this half is meant to
   * be overridable (a consumer may want a different elevation), the other half
   * is not. Merging them back would silently take that away.
   */
  dropdownFloatingSurface: {
    borderStyle: 'none',
    overflow: 'visible',
    boxShadow: shadows.lg,
    color: 'inherit',
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    marginTop: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 0,
  },
  /**
   * Positioning half: `position: fixed` plus the top layer, because an
   * absolutely positioned list is clipped by any scrolling ancestor — see
   * `useVirtualSelectDropdownPosition`, which supplies the coordinates. `inset`
   * is the UA stylesheet's `inset: 0`, which belongs here rather than with the
   * surface: left alone it pins the list to all four viewport edges.
   */
  dropdownFloatingPosition: {
    inset: 'auto',
    position: 'fixed',
    zIndex: zIndex.dropdown,
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
