import { spacing } from '@lcabrera/ui/design-system/tokens/base.stylex';
import { colors } from '@lcabrera/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

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
