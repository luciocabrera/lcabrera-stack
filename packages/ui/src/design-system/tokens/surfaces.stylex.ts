import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  transitions,
} from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

export const surfaceStyles = stylex.create({
  glass: {
    backdropFilter: colors.glassBackdropFilterPrimary,
    backgroundColor: colors.glassBackgroundColorPrimary,
    backgroundImage: colors.glassGradientBackground,
  },
  glassPanel: {
    backdropFilter: colors.glassBackdropFilterPrimary,
    backgroundColor: colors.glassBackgroundColorPrimary,
  },
  /**
   * The resting card for rows and option cards that answer the pointer — a
   * translucent fill that lifts to `surfaceElevated` on hover.
   *
   * A consumer needing an extra state on a property this recipe owns must
   * restate the recipe's default alongside it: a value-level conditional
   * compiles to a single property key, so `borderColor: { ':focus-visible': x }`
   * replaces the whole key and silently drops the resting border. StyleX 0.19
   * removed selector nesting, so there is no way to add one state in isolation.
   *
   * Not `Card`'s `interactiveVariants.hoverable`, which is a different,
   * shadow-based lift over an opaque `surfacePrimary` fill.
   */
  interactiveCard: {
    borderColor: colors.borderPrimary,
    borderRadius: borderRadius.md,
    borderStyle: 'solid',
    borderWidth: '1px',
    transition: `background-color ${transitions.fast}, border-color ${transitions.fast}`,
    backgroundColor: {
      default: colors.glassBackgroundColorSecondary,
      ':hover': colors.surfaceElevated,
    },
  },
});
