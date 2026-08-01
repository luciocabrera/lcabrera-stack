import { colors } from '@lcabrera/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

/**
 * Shared surface recipes for the two translucent surfaces this design system
 * has. Both build on `glassBackdropFilterPrimary` (blur/saturation) +
 * `glassBackgroundColorPrimary` (translucent fill); they differ only in whether
 * the layered radial tint is painted on top:
 *
 * - `glass` — gradient-lit, for a surface that is the focus of the screen
 *   (`Modal`). Adds `glassGradientBackground`.
 * - `glassPanel` — plain, for chrome that frames or floats over content
 *   (`SidePanel`, the table actions popover). The tint would compete with the
 *   content underneath, so it is deliberately left off.
 *
 * Compose either before a component's own layout styles so those can still
 * override, e.g. `stylex.props(surfaceStyles.glass, local)`.
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
});
