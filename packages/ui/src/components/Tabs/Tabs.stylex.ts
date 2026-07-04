import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  spacing,
  transitions,
  typography,
} from '@repo/ui/design-system/tokens/base.stylex';
import { colors } from '@repo/ui/design-system/tokens/colors.stylex';
import { skeleton } from '@repo/ui/design-system/tokens/commons.stylex';

export const styles = stylex.create({
  container: {
    gap: spacing.sm,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
  },
  tabList: {
    margin: 0,
    padding: 0,
    gap: spacing.xs,
    listStyle: 'none',
    display: 'flex',
    borderBottomColor: colors.borderPrimary,
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
  },
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
      ':focus-visible': '2px',
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
  tabContent: {
    // Reserve space for scrollbar on both edges to keep content visually centered
    scrollbarGutter: 'stable both-edges',
    flex: '1',
    overflow: 'auto',
    // padding: `${spacing.sm} ${spacing.md}`,
    paddingInline: spacing.sm,
    minHeight: 0,
  },
  tabPanel: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
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
