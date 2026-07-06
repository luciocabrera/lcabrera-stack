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
    flexGrow: 1,
    fontFamily: typography.fontFamilyMono,
    fontSize: typography.fontSizeSm,
    overflowWrap: 'anywhere',
    minWidth: 0,
  },
  dropdown: {
    padding: spacing.sm,
    borderColor: colors.borderPrimary,
    borderRadius: borderRadius.md,
    borderStyle: 'solid',
    borderWidth: '1px',
    backgroundColor: colors.surfacePrimary,
  },
  entryButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderStyle: 'none',
    gap: spacing.sm,
    alignItems: 'center',
    backgroundColor: {
      default: 'transparent',
      ':hover': colors.surfaceSecondary,
    },
    color: colors.textPrimary,
    cursor: 'pointer',
    display: 'flex',
    textAlign: 'left',
    width: '100%',
  },
  entryButtonActive: {
    backgroundColor: colors.surfaceSecondary,
  },
  error: {
    color: colors.errorText,
  },
  headerActions: {
    gap: spacing.xs,
    alignItems: 'center',
    display: 'flex',
  },
  header: {
    gap: spacing.xs,
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
    paddingBottom: spacing.xs,
  },
  list: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    borderTopColor: colors.borderPrimary,
    borderTopStyle: 'solid',
    borderTopWidth: '1px',
    marginTop: spacing.xs,
    maxHeight: '20rem',
    overflowY: 'auto',
    paddingTop: spacing.xs,
  },
});
