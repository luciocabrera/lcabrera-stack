import * as stylex from '@stylexjs/stylex';

import { spacing, typography } from '@/design-system/tokens/base.stylex';

export const cardTitleStyles = stylex.create({
  title: {
    margin: 0,
    gap: spacing.xs,
    alignItems: 'center',
    display: 'flex',
    fontSize: typography.fontSizeLg,
    fontWeight: typography.fontWeightSemibold,
  },
  icon: {
    flexShrink: 0,
    height: spacing.lg,
    width: spacing.lg,
  },
});
