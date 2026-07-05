import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  spacing,
  typography,
} from '@repo/ui/design-system/tokens/base.stylex';
import { colors } from '@repo/ui/design-system/tokens/colors.stylex';

const base = stylex.create({
  badge: {
    alignItems: 'center',
    borderRadius: borderRadius.full,
    display: 'inline-flex',
    fontSize: typography.fontSizeXs,
    fontWeight: typography.fontWeightSemibold,
    paddingBlock: spacing.xs,
    paddingInline: spacing.sm,
    whiteSpace: 'nowrap',
    width: 'fit-content',
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
    backgroundColor: colors.backgroundTertiary,
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
  badge: base.badge,
  tone: toneVariants,
};
