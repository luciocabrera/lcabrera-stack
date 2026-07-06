import {
  borderRadius,
  spacing,
  typography,
} from '@repo/ui/design-system/tokens/base.stylex';
import { colors } from '@repo/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  currentPath: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamilyMono,
    fontSize: typography.fontSizeSm,
    overflowWrap: 'anywhere',
  },
  entryButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderStyle: 'none',
    gap: spacing.sm,
    alignItems: 'center',
    backgroundColor: {
      ':hover': colors.surfaceSecondary,
      default: 'transparent',
    },
    color: colors.textPrimary,
    cursor: 'pointer',
    display: 'flex',
    textAlign: 'left',
    width: '100%',
  },
  error: {
    color: colors.errorText,
  },
  header: {
    gap: spacing.xs,
    alignItems: 'flex-start',
    display: 'flex',
    flexDirection: 'column',
  },
  list: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    height: '320px',
    overflowY: 'auto',
  },
});
