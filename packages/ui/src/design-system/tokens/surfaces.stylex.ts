import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  transitions,
} from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

/**
 * Shared surface recipes. Each carries a surface and nothing that positions or
 * sizes it — fill, border and radius, never padding, gap or display — so a
 * consumer composes the recipe first and keeps its own layout on top:
 * `stylex.props(surfaceStyles.glass, local)`.
 *
 * Two of them are the translucent chrome surfaces, both built on
 * `glassBackdropFilterPrimary` (blur/saturation) + `glassBackgroundColorPrimary`
 * (translucent fill), differing only in whether the layered radial tint is
 * painted on top:
 *
 * - `glass` — gradient-lit, for a surface that is the focus of the screen
 *   (`Modal`). Adds `glassGradientBackground`.
 * - `glassPanel` — plain, for chrome that frames or floats over content
 *   (`SidePanel`, the table actions popover). The tint would compete with the
 *   content underneath, so it is deliberately left off.
 *
 * The third, `interactiveCard`, is not chrome but content: the resting card for
 * rows and option cards that answer the pointer.
 *
 * Never compose two recipes from this file onto one element. All three declare
 * `backgroundColor`, and StyleX merges by property key, so the later one wipes
 * the earlier one's fill instead of layering over it.
 */
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
