import * as stylex from '@stylexjs/stylex';

import { spacing, typography } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const sidePanelTitleStyles = stylex.create({
  icon: {
    flexShrink: 0,
    height: spacing.lg,
    width: spacing.lg,
  },
  title: {
    margin: 0,
    gap: spacing.xs,
    alignItems: 'center',
    color: colors.textPrimary,
    display: 'flex',
    fontSize: typography.fontSizeXl,
    fontWeight: typography.fontWeightSemibold,
  },
});
