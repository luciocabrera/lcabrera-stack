import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  spacing,
  typography,
} from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

const local = stylex.create({
  container: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    fontSize: typography.fontSizeSm,
    lineHeight: 1.5,
  },
});

const toneVariants = stylex.create({
  error: {
    backgroundColor: colors.errorBackground,
    color: colors.errorText,
  },
  info: {
    backgroundColor: colors.infoBackground,
    color: colors.infoText,
  },
  neutral: {
    backgroundColor: colors.surfaceSecondary,
    color: colors.textSecondary,
  },
  success: {
    backgroundColor: colors.successBackground,
    color: colors.successText,
  },
  warning: {
    backgroundColor: colors.warningBackground,
    color: colors.warningText,
  },
});

export const styles = {
  container: local.container,
  tone: toneVariants,
};
