import {
  spacing,
  typography,
} from '@lcabrera/ui/design-system/tokens/base.stylex';
import { colors } from '@lcabrera/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  container: {
    gap: spacing.xxs,
    display: 'flex',
    flexDirection: 'column',
  },
  description: {
    margin: 0,
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
  },
  label: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeXs,
    fontWeight: typography.fontWeightMedium,
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
  },
  value: {
    margin: 0,
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    fontWeight: typography.fontWeightMedium,
    overflowWrap: 'anywhere',
  },
});
