import * as stylex from '@stylexjs/stylex';

import { spacing } from '#ui/design-system/tokens/base.stylex';

export const styles = stylex.create({
  tabContent: {
    // Reserve space for scrollbar on both edges to keep content visually centered
    scrollbarGutter: 'stable both-edges',
    flex: '1',
    overflow: 'auto',
    minHeight: 0,
  },
  tabPanel: {
    paddingInline: spacing.sm,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
  },
  tabPanelFlush: {
    paddingInline: 0,
  },
});
