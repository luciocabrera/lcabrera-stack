import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  shadows,
  spacing,
  zIndex,
} from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  // The translucent surface is `surfaceStyles.glassPanel`, composed ahead of
  // this by the component — the same recipe SidePanel uses, so a menu floating
  // over the grid reads as the same material as the settings drawer beside it.
  menu: {
    padding: spacing.xs,
    borderColor: colors.borderPrimary,
    borderRadius: borderRadius.sm,
    borderStyle: 'solid',
    borderWidth: '1px',
    boxShadow: shadows.md,
    zIndex: zIndex.popover,
    minWidth: '12rem',
  },
  menuActions: {
    gap: spacing.xxs,
    alignItems: 'stretch',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    zIndex: 1,
  },
  menuHidden: {
    visibility: 'hidden',
  },
  menuIcon: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
    minWidth: '1rem',
  },
  menuItem: {
    justifyContent: 'flex-start',
    textAlign: 'left',
    width: '100%',
  },
  // Rendered as its own flex child of `menuActions` (see
  // TableActionsPopoverSeparator), so the container's gap already applies on
  // both sides of the rule and this margin only adds to both equally. The
  // border/margin resets are the `<hr>` user-agent defaults.
  menuSeparator: {
    borderStyle: 'none',
    marginBlock: spacing.xxs,
    marginInline: 0,
    backgroundColor: colors.borderPrimary,
    flexShrink: 0,
    height: '1px',
  },
  menuPosition: (left: number, top: number) => ({
    margin: 0,
    position: 'fixed',
    left,
    top,
  }),
  trigger: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
  },
});
