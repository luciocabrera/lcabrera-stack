import * as stylex from '@stylexjs/stylex';

import { spacing } from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

export const sidePanelFooterStyles = stylex.create({
  footer: {
    padding: spacing.sm,
    gap: spacing.md,
    display: 'flex',
    flexShrink: 0,
    borderTopColor: colors.borderPrimary,
    borderTopStyle: 'solid',
    borderTopWidth: '1px',
  },
});
