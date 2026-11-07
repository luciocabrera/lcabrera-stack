import * as stylex from '@stylexjs/stylex';

import { spacing } from '#ui/design-system/tokens/base.stylex';

const local = stylex.create({
  list: {
    margin: 0,
    minWidth: 0,
  },
  value: {
    overflowWrap: 'anywhere',
    minWidth: 0,
  },
});

const layoutVariants = stylex.create({
  grid: {
    columnGap: spacing.md,
    display: 'grid',
    gridTemplateColumns: 'max-content minmax(0, 1fr)',
    rowGap: spacing.xs,
  },
  inline: {
    columnGap: spacing.lg,
    display: 'flex',
    flexWrap: 'wrap',
    rowGap: spacing.xs,
  },
});

const itemVariants = stylex.create({
  grid: {
    display: 'contents',
  },
  inline: {
    gap: spacing.xs,
    alignItems: 'baseline',
    display: 'inline-flex',
    minWidth: 0,
  },
});

export const styles = {
  item: itemVariants,
  layout: layoutVariants,
  list: local.list,
  value: local.value,
};
