import {
  spacing,
  typography,
} from '@lcabrera/ui/design-system/tokens/base.stylex';
import { colors } from '@lcabrera/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

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
