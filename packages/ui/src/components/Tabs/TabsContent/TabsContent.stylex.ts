import * as stylex from '@stylexjs/stylex';

import { spacing } from '#ui/design-system/tokens/base.stylex';

export const styles = stylex.create({
  tabContent: {
    // Reserve space for scrollbar on both edges to keep content visually centered
    scrollbarGutter: 'stable both-edges',
    flex: '1',
    overflow: 'auto',
    paddingInline: spacing.sm,
    minHeight: 0,
  },
  tabPanel: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
  },
});
