import { typography, zIndex } from '@repo/ui/design-system/tokens/base.stylex';
import { colors } from '@repo/ui/design-system/tokens/colors.stylex';
import { skeleton } from '@repo/ui/design-system/tokens/commons.stylex';
import * as stylex from '@stylexjs/stylex';

export const tableHeaderCellStyles = stylex.create({
  base: (minWidth?: number | string, width?: number | string) => ({
    paddingInline: '6px', // 'var(--table-padding-inline)',
    alignItems: 'center',
    boxSizing: 'border-box',
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
  pinnedLeft: (offset: number) => ({
    backgroundColor: colors.surfaceSecondary,
    zIndex: `calc(${zIndex.sticky} + 2)`,
    left: offset,
  }),
  pinnedRight: (offset: number) => ({
    backgroundColor: colors.surfaceSecondary,
    zIndex: `calc(${zIndex.sticky} + 2)`,
    right: offset,
  }),
  pinnedShadowLeft: {
    boxShadow: '4px 0 8px -2px rgba(0, 0, 0, 0.12)',
    borderRightColor: colors.borderPrimary,
    borderRightWidth: 2,
  },
  pinnedShadowRight: {
    boxShadow: '-4px 0 8px -2px rgba(0, 0, 0, 0.12)',
    borderLeftColor: colors.borderPrimary,
    borderLeftStyle: 'solid',
    borderLeftWidth: 2,
  },
  content: {
    flex: '1',
    overflow: 'hidden',
    display: 'block',
    textAlign: 'left',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  },
});

export const skeletonStyles = { ...skeleton };
