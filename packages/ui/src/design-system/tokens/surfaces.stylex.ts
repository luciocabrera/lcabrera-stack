import { colors } from '@lcabrera/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

/**
 * Shared surface recipes. The `glass` recipe is the single source for the
 * blurred, gradient-lit translucent surface previously inlined in
 * `Modal.stylex.ts`: `glassBackdropFilterPrimary` (blur/saturation) +
 * `glassBackgroundColorPrimary` (translucent fill) + `glassGradientBackground`
 * (the layered radial tint). Compose it before a component's own layout styles
 * so those can still override, e.g. `stylex.props(surfaceStyles.glass, local)`.
 */
export const surfaceStyles = stylex.create({
  glass: {
    backdropFilter: colors.glassBackdropFilterPrimary,
    backgroundColor: colors.glassBackgroundColorPrimary,
    backgroundImage: colors.glassGradientBackground,
  },
});
