import { spacing } from '@lcabrera/ui/design-system/tokens/base.stylex';
import * as stylex from '@stylexjs/stylex';

export const layoutStyles = stylex.create({
  list: {
    margin: 0,
    paddingInlineStart: spacing.lg,
  },
  page: {
    padding: spacing.xl,
    gap: spacing.lg,
    display: 'flex',
    flexDirection: 'column',
  },
  row: {
    margin: 0,
    padding: 0,
    gap: spacing.md,
    listStyle: 'none',
    display: 'flex',
    flexWrap: 'wrap',
  },
  section: {
    gap: spacing.sm,
    display: 'flex',
    flexDirection: 'column',
  },
});
