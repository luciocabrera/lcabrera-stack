import * as stylex from '@stylexjs/stylex';

import { typography } from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';
import { overlayStyles } from '#ui/design-system/tokens/commons.stylex';

const specific = stylex.create({
  backgroundShell: {
    flex: '1 1 auto',
    display: 'flex',
    minHeight: 0,
  },
  backgroundOverlay: { opacity: colors.gradientOpacityPrimary },
  base: {
    overflow: 'hidden',
    transition: 'background-color 0.3s ease, color 0.3s ease',
    backgroundColor: colors.backgroundPrimary,
    color: colors.textPrimary,
    display: 'flex',
    flexDirection: 'column',
    fontFamily: typography.fontFamily,
  },
  containerHeight: {
    height: '100%',
  },
  viewportHeight: {
    height: '100vh',
  },
});

export const styles = {
  ...specific,
  ...overlayStyles,
};
