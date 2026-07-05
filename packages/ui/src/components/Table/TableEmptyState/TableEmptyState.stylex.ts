import * as stylex from '@stylexjs/stylex';

import { spacing, typography } from '@repo/ui/design-system/tokens/base.stylex';
import { colors } from '@repo/ui/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  cell: {
    padding: 0,
    borderStyle: 'none',
    borderWidth: 0,
  },
  content: {
    padding: spacing.xl,
    gap: spacing.md,
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    maxWidth: '100%',
    textAlign: 'center',
  },
  illustration: {
    color: colors.textTertiary,
    maxWidth: 'min(320px, 70%)',
    width: '100%',
  },
  message: {
    margin: 0,
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    lineHeight: typography.lineHeightNormal,
    maxWidth: '44ch',
  },
  row: {
    display: 'table-row',
  },
  title: {
    margin: 0,
    color: colors.textPrimary,
    fontSize: typography.fontSizeXl,
    fontWeight: typography.fontWeightSemibold,
  },
  viewport: (height: number, width: number) => ({
    padding: spacing.md,
    alignItems: 'center',
    boxSizing: 'border-box',
    display: 'flex',
    height: height > 0 ? `${height}px` : 'auto',
    justifyContent: 'center',
    left: 0,
    overflow: 'hidden',
    position: 'sticky',
    top: 0,
    width: width > 0 ? `${width}px` : '100%',
  }),
});
