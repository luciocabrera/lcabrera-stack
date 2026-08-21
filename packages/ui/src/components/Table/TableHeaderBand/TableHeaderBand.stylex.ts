import * as stylex from '@stylexjs/stylex';

import { typography, zIndex } from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

export const tableHeaderBandStyles = stylex.create({
  base: (width?: number | string) => ({
    paddingInline: '6px',
    alignItems: 'flex-end',
    boxSizing: 'border-box',
    color: colors.textTertiary,
    display: 'flex',
    fontSize: typography.fontSizeXs,
    fontWeight: typography.fontWeightSemibold,
    justifyContent: 'flex-start',
    paddingBlockEnd: '2px',
    position: 'sticky',
    zIndex: zIndex.sticky,
    height: '100%',
    maxHeight: '100%',
    maxWidth: width ?? null,
    minWidth: width ?? null,
    top: 0,
    width: width ?? null,
  }),
  // A labelled band is the only one that draws: the rest hold space above
  // columns that have no group, and a border there would draw a box around
  // nothing.
  labelled: {
    borderBottomColor: colors.borderSecondary,
    borderBottomStyle: 'solid',
    borderBottomWidth: 1,
  },
  label: {
    overflow: 'hidden',
    display: 'block',
    letterSpacing: '0.02em',
    textAlign: 'left',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  },
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
});
