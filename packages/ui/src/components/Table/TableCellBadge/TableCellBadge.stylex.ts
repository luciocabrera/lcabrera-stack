import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  spacing,
  typography,
} from '#ui/design-system/tokens/base.stylex';

export const styles = stylex.create({
  cell: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
    minWidth: 0,
    width: '100%',
  },
  pill: {
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    paddingBlock: '2px',
    paddingInline: spacing.xs,
    fontSize: typography.fontSizeSm,
    fontWeight: typography.fontWeightSemibold,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
  },
  tone: (background: string, text: string) => ({
    backgroundColor: background,
    color: text,
  }),
});
