import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  spacing,
  typography,
} from '@repo/ui/design-system/tokens/base.stylex';
import { colors } from '@repo/ui/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  currentPath: {
    fontFamily: typography.fontFamilyMono,
    fontSize: typography.fontSizeSm,
    overflowWrap: 'anywhere',
    color: colors.textSecondary,
  },
  entryButton: {
    gap: spacing.sm,
    alignItems: 'center',
    display: 'flex',
    width: '100%',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderStyle: 'none',
    backgroundColor: 'transparent',
    color: colors.textPrimary,
    cursor: 'pointer',
    textAlign: 'left',
    ':hover': {
      backgroundColor: colors.surfaceSecondary,
    },
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
