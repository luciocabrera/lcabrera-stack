import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  spacing,
  typography,
  zIndex,
} from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';
import { skelleton } from '@/design-system/tokens/commons.stylex';

export const tableHeaderCellStyles = stylex.create({
  base: (minWidth?: number | string, width?: number | string) => ({
    borderColor: 'red',
    borderStyle: 'solid',
    paddingInline: '6px', // 'var(--table-padding-inline)',
    alignItems: 'center',
    color: colors.textSecondary,
    display: 'flex',
    fontSize: typography.fontSizeSm,
    fontWeight: typography.fontWeightSemibold,
    justifyContent: 'flex-start',
    position: 'sticky',
    zIndex: zIndex.sticky,
    borderRightColor: colors.borderSecondary,
    borderRightStyle: 'solid',
    borderRightWidth: 1,
    height: '100%',
    maxHeight: '100%',
    maxWidth: width ?? null,
    minWidth: minWidth ?? width ?? null,
    top: 0,
    width: width ?? null,
  }),
  content: {
    flex: '1',
    overflow: 'hidden',
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'flex-start',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  controls: {
    gap: spacing.xxs,
    alignItems: 'center',
    display: 'flex',
    flexShrink: 0,
  },
  settingsButton: {
    padding: 0,
    borderRadius: borderRadius.sm,
    borderStyle: 'none',
    alignItems: 'center',
    backgroundColor: {
      default: 'transparent',
      ':hover': colors.hover,
    },
    color: {
      default: colors.textTertiary,
      ':hover': colors.textSecondary,
    },
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    height: 20,
    width: 20,
  },
  sortButton: {
    padding: 0,
    borderRadius: borderRadius.sm,
    borderStyle: 'none',
    alignItems: 'center',
    backgroundColor: {
      default: 'transparent',
      ':hover': colors.hover,
    },
    color: {
      default: colors.textTertiary,
      ':hover': colors.textSecondary,
    },
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    height: 20,
    width: 20,
  },
  sortButtonActive: {
    color: colors.textPrimary,
  },
});

export const skelletonStyles = { ...skelleton };
