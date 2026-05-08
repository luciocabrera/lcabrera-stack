import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  shadows,
  spacing,
  typography,
} from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  bodyContent: {
    padding: spacing.sm,
  },
  brand: {
    gap: spacing.sm,
    minWidth: 0,
    alignItems: 'center',
    display: 'flex',
  },
  brandCompact: {
    justifyContent: 'center',
    width: '100%',
  },
  brandIcon: {
    alignItems: 'center',
    borderColor: colors.borderPrimary,
    borderRadius: borderRadius.md,
    borderStyle: 'solid',
    borderWidth: 1,
    color: colors.textPrimary,
    display: 'flex',
    flexShrink: 0,
    justifyContent: 'center',
    height: '2.25rem',
    width: '2.25rem',
  },
  brandText: {
    minWidth: 0,
    overflow: 'hidden',
    display: 'block',
    fontSize: typography.fontSizeXl,
    fontWeight: typography.fontWeightSemibold,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  brandTextHidden: {
    display: 'none',
  },
  footer: {
    padding: spacing.sm,
  },
  header: {
    padding: spacing.md,
    gap: spacing.md,
    flexShrink: 0,
    borderBottomColor: colors.borderPrimary,
    borderBottomStyle: 'solid',
    borderBottomWidth: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  headerActions: {
    gap: spacing.xs,
    display: 'flex',
    justifyContent: 'flex-end',
  },
  headerActionsCompact: {
    flexDirection: 'column',
  },
  headerRow: {
    gap: spacing.sm,
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
  },
  launcher: {
    padding: spacing.sm,
    borderRightColor: colors.borderPrimary,
    borderRightStyle: 'solid',
    borderRightWidth: 1,
    backgroundColor: colors.surfacePrimary,
    boxShadow: shadows.md,
    flexShrink: 0,
    width: '4.5rem',
  },
});
