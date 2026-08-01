import { spacing } from '@lcabrera/ui/design-system/tokens/base.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  // Root list only — takes the height FormBody offers, which a lone tab child
  // then fills via its own `height: 100%`.
  region: {
    flex: '1 1 auto',
    minHeight: 0,
  },
  // Root list only, and only when nothing inside it already scrolls (see
  // hasScrollOwningChild.util). `both-edges` keeps the gutter symmetric,
  // so the fields stay centred and do not resize when the bar appears.
  scroll: {
    scrollbarGutter: 'stable both-edges',
    overflowY: 'auto',
  },
  stack: {
    gap: spacing.md,
    display: 'flex',
    flexDirection: 'column',
  },
});
