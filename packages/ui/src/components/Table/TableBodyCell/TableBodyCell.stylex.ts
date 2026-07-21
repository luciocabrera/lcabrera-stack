import {
  typography,
  zIndex,
} from '@lcabrera/ui/design-system/tokens/base.stylex';
import { colors } from '@lcabrera/ui/design-system/tokens/colors.stylex';
import { skeleton } from '@lcabrera/ui/design-system/tokens/commons.stylex';
import * as stylex from '@stylexjs/stylex';

export const tableBodyCellStyles = stylex.create({
  alignCenter: {
    justifyContent: 'center',
    textAlign: 'center',
  },
  alignRight: {
    justifyContent: 'flex-end',
    textAlign: 'right',
  },
  base: (minWidth?: number | string, width?: number | string) => ({
    paddingInline: '6px',
    alignItems: 'center',
    boxSizing: 'border-box',
    color: colors.textPrimary,
    display: 'flex',
    fontSize: typography.fontSizeSm,
    fontWeight: typography.fontWeightNormal,
    position: 'relative',
    borderRightColor: colors.borderSecondary,
    borderRightStyle: 'solid',
    borderRightWidth: 1,
    height: '100%',
    maxHeight: '100%',
    maxWidth: width ?? minWidth ?? null,
    minWidth: minWidth ?? width ?? null,
    width: width ?? minWidth ?? null,
  }),
  pinnedLeft: (offset: number) => ({
    backgroundColor: colors.surfaceSecondary,
    position: 'sticky',
    zIndex: `calc(${zIndex.sticky} - 1)`,
    left: offset,
  }),
  pinnedRight: (offset: number) => ({
    backgroundColor: colors.surfaceSecondary,
    position: 'sticky',
    zIndex: `calc(${zIndex.sticky} - 1)`,
    right: offset,
  }),
  pinnedShadowLeft: {
    boxShadow: '4px 0 8px -2px rgba(0, 0, 0, 0.08)',
    borderRightColor: colors.borderPrimary,
    borderRightStyle: 'solid',
    borderRightWidth: 2,
  },
  pinnedShadowRight: {
    boxShadow: '-4px 0 8px -2px rgba(0, 0, 0, 0.08)',
    borderLeftColor: colors.borderPrimary,
    borderLeftStyle: 'solid',
    borderLeftWidth: 2,
  },
  booleanContent: {
    width: 'auto',
  },
  textContent: {
    overflow: 'hidden',
    display: 'block',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    width: '100%',
  },
});

export const skeletonStyles = { ...skeleton };
