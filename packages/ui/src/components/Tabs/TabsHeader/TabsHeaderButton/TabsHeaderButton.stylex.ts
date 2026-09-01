import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  spacing,
  transitions,
  typography,
} from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';
import { skeleton } from '#ui/design-system/tokens/commons.stylex';

export const styles = stylex.create({
  tabButton: {
    borderRadius: {
      default: null,
      ':focus-visible': borderRadius.sm,
    },
    outline: {
      default: 'none',
      ':focus-visible': `2px solid ${colors.brandPrimary}`,
    },
    paddingBlock: spacing.sm,
    paddingInline: spacing.md,
    transition: `color ${transitions.fast}, border-color ${transitions.fast}`,
    backgroundColor: 'transparent',
    color: {
      default: colors.textSecondary,
      ':hover': colors.textPrimary,
    },
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: typography.fontSizeSm,
    fontWeight: 500,
    outlineOffset: {
      default: '0px',
      ':focus-visible': '-2px',
    },
    position: 'relative',
    borderBottomColor: 'transparent',
    borderBottomStyle: 'solid',
    borderBottomWidth: '2px',
    borderLeftStyle: 'none',
    borderRightStyle: 'none',
    borderTopStyle: 'none',
    marginBottom: '-1px',
  },
  tabButtonActive: {
    color: colors.brandPrimaryText,
    borderBottomColor: colors.brandPrimaryText,
  },
  tabBusyOverlay: {
    borderRadius: borderRadius.sm,
    insetBlock: 0,
    insetInline: 0,
  },
});

export const busyStyles = {
  overlay: [skeleton.loadingOverlay, styles.tabBusyOverlay],
  wave: skeleton.shimmerWave,
};
