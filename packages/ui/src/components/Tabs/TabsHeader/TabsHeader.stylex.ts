import { spacing } from '@lcabrera/ui/design-system/tokens/base.stylex';
import { colors } from '@lcabrera/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  tabList: {
    margin: 0,
    padding: 0,
    gap: spacing.xs,
    listStyle: 'none',
    display: 'flex',
    borderBottomColor: colors.borderPrimary,
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
  },
});
