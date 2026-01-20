import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  spacing,
  typography,
} from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  container: {
    gap: spacing.md,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  clearSection: {
    paddingTop: spacing.sm,
  },
  header: {
    margin: 0,
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    fontWeight: 600,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  addSection: {
    gap: spacing.sm,
    display: 'flex',
    flexDirection: 'column',
  },
  select: {
    borderColor: colors.borderPrimary,
    borderRadius: borderRadius.md,
    borderStyle: 'solid',
    borderWidth: '1px',
    paddingBlock: spacing.sm,
    paddingInline: spacing.md,
    backgroundColor: colors.surfacePrimary,
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    width: '100%',
  },
  filtersListContainer: {
    flex: '1',
    gap: spacing.sm,
    display: 'flex',
    flexDirection: 'column',
  },
  filtersList: {
    gap: spacing.sm,
    display: 'flex',
    flexDirection: 'column',
  },
  filterItem: {
    borderColor: colors.borderPrimary,
    borderRadius: borderRadius.md,
    borderStyle: 'solid',
    borderWidth: '1px',
    overflow: 'hidden',
    backgroundColor: colors.surfacePrimary,
  },
  filterItemHeader: {
    padding: spacing.sm,
    gap: spacing.sm,
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
  },
  filterToggle: {
    padding: 0,
    borderWidth: 0,
    gap: spacing.sm,
    alignItems: 'center',
    backgroundColor: 'transparent',
    color: colors.textPrimary,
    cursor: 'pointer',
    display: 'flex',
    flexGrow: 1,
    fontSize: typography.fontSizeSm,
  },
  filterToggleIcon: {
    color: colors.textSecondary,
    flexShrink: 0,
    fontSize: typography.fontSizeXs,
  },
  filterItemLabel: {
    color: colors.textPrimary,
    flexGrow: 1,
    fontSize: typography.fontSizeSm,
    fontWeight: 500,
  },
  invalidBadge: {
    color: colors.error,
    fontSize: typography.fontSizeXs,
    fontWeight: 600,
  },
  filterItemContent: {
    padding: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderTopColor: colors.borderPrimary,
    borderTopStyle: 'solid',
    borderTopWidth: '1px',
  },
  emptyState: {
    paddingBlock: spacing.lg,
    color: colors.textTertiary,
    fontSize: typography.fontSizeSm,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
