import * as stylex from '@stylexjs/stylex';

import { typography } from '@repo/ui/design-system/tokens/base.stylex';
import { colors } from '@repo/ui/design-system/tokens/colors.stylex';
import { overlayStyles } from '@repo/ui/design-system/tokens/commons.stylex';

const specific = stylex.create({
  appShell: {
    flex: '1 1 auto',

    display: 'flex',
    minHeight: 0,
  },
  appOverlay: { opacity: colors.gradientOpacityPrimary },
  base: {
    overflow: 'hidden',
    transition: 'background-color 0.3s ease, color 0.3s ease',
    backgroundColor: colors.backgroundPrimary,
    color: colors.textPrimary,
    display: 'flex',
    flexDirection: 'column',
    fontFamily: typography.fontFamily,
    height: '100vh',
    maxWidth: '100dvw',
  },
  outletWrapper: {
    flex: '1 1 auto',
    scrollbarColor: `${colors.borderSecondary} transparent`,
    scrollbarWidth: 'thin',
    minHeight: 0,
    overflowY: 'auto',
  },
});

export const styles = {
  ...specific,
  ...overlayStyles,
};
