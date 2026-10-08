import {
  borderRadius,
  spacing,
  typography,
} from '@lcabrera/ui/design-system/tokens/base.stylex';
import { colors } from '@lcabrera/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  facts: {
    margin: 0,
    gap: spacing.xxs,
    display: 'grid',
    gridTemplateColumns:
      'repeat(auto-fill, minmax(120px, max-content) minmax(160px, 1fr))',
  },
  factTerm: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
  },
  factValue: {
    margin: 0,
    fontSize: typography.fontSizeSm,
  },
  header: {
    padding: spacing.lg,
    gap: spacing.md,
    display: 'flex',
    flexDirection: 'column',
  },
  note: {
    margin: 0,
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
  },
  page: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0,
  },
  panel: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceSecondary,
  },
  table: {
    flexGrow: 1,
    minHeight: '400px',
  },
  title: {
    margin: 0,
    fontSize: typography.fontSizeXl,
    fontWeight: typography.fontWeightBold,
  },
});
