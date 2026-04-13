import * as stylex from '@stylexjs/stylex';

import { spacing } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const cardFooterStyles = stylex.create({
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.backgroundSecondary,
    borderTopColor: colors.borderPrimary,
    borderTopStyle: 'solid',
    borderTopWidth: '1px',
  },
});
