import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  shadows,
  spacing,
  typography,
  zIndex,
} from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

const localStyles = stylex.create({
  chevron: (isOpen: boolean) => ({
    borderColor: isOpen
      ? `transparent transparent ${colors.textSecondary} transparent`
      : `${colors.textSecondary} transparent transparent transparent`,
    borderStyle: 'solid',
    borderWidth: isOpen ? '0 4px 5px 4px' : '5px 4px 0 4px',
    flexShrink: 0,
    height: 0,
    marginLeft: 'auto',
    width: 0,
  }),
  container: {
    position: 'relative',
    width: '100%',
  },
  dropdown: {
    borderColor: colors.borderPrimary,
    borderRadius: borderRadius.md,
    borderStyle: 'solid',
    borderWidth: '1px',
    overflow: 'hidden',
    backgroundColor: colors.surfacePrimary,
    boxShadow: shadows.lg,
    display: 'flex',
    flexDirection: 'column',
    position: 'absolute',
    zIndex: zIndex.dropdown,
    // borderTopLeftRadius: 0,
    // borderTopRightRadius: 0,
    left: 0,
    marginTop: spacing.sm,
    right: 0,
    top: '100%',
  },
  trigger: {
    padding: `${spacing.xs} ${spacing.sm}`,
    borderColor: {
      default: colors.borderPrimary,
      // ':focus-visible': colors.borderFocus,
    },
    borderRadius: borderRadius.sm,
    borderStyle: 'solid',
    borderWidth: '1px',
    gap: spacing.xs,
    outline: 'none !important',
    alignItems: 'center',
    backgroundColor: colors.surfacePrimary,
    cursor: 'pointer',
    display: 'flex',
    flexWrap: 'wrap',
    textAlign: 'left',
    minHeight: '2.25rem',
    width: '100%',
  },
  triggerLabel: {
    flex: '1 1 auto',
    overflow: 'hidden',
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  },
  triggerOpen: {
    borderColor: colors.borderPrimary,
  },
  triggerPlaceholder: {
    flex: '1 1 auto',
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    minWidth: 0,
  },
  loadedCount: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeXs,
    marginTop: spacing.xxs,
  },
});

export const styles = {
  chevron: localStyles.chevron,
  container: localStyles.container,
  dropdown: localStyles.dropdown,
  loadedCount: localStyles.loadedCount,
  trigger: localStyles.trigger,
  triggerLabel: localStyles.triggerLabel,
  triggerOpen: localStyles.triggerOpen,
  triggerPlaceholder: localStyles.triggerPlaceholder,
};
