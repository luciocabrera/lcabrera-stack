import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  spacing,
  typography,
} from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';
import { drawerSectionStyles } from '@/design-system/tokens/drawerSection.stylex';

const localStyles = stylex.create({
  container: {
    flex: '1',
    gap: spacing.md,
    display: 'flex',
    flexDirection: 'column',
  },
  filterItem: {
    borderColor: colors.borderPrimary,
    borderRadius: borderRadius.md,
    borderStyle: 'solid',
    borderWidth: '1px',
    overflow: 'visible',
    backgroundColor: {
      default: colors.surfaceSecondary,
      ':hover': colors.surfaceElevated,
    },
  },
  filterItemHeader: {
    gap: spacing.sm,
    paddingBlock: spacing.xxs,
    paddingInline: spacing.md,
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
    height: '34px',
  },
  filterToggle: {
    padding: 0,
    borderWidth: 0,
    gap: spacing.xs,
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
    textAlign: 'left',
  },
  invalidBadge: {
    color: colors.error,
    fontSize: typography.fontSizeXs,
    fontWeight: 600,
  },
  filterItemContent: {
    padding: spacing.md,
    backgroundColor: colors.surfaceSecondary,
    borderBottomLeftRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
    borderTopColor: colors.borderPrimary,
    borderTopStyle: 'solid',
    borderTopWidth: '1px',
  },
});

export const styles = {
  container: localStyles.container,
  filterItem: localStyles.filterItem,
  filterItemContent: localStyles.filterItemContent,
  filterItemHeader: localStyles.filterItemHeader,
  filterItemLabel: localStyles.filterItemLabel,
  filterToggle: localStyles.filterToggle,
  filterToggleIcon: localStyles.filterToggleIcon,
  filtersList: drawerSectionStyles.list,
  invalidBadge: localStyles.invalidBadge,
};
