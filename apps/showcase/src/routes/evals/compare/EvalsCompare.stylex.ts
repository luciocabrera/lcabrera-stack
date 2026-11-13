import { spacing } from '@lcabrera/ui/design-system/tokens/base.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  form: {
    gap: spacing.md,
    alignItems: 'flex-end',
    display: 'flex',
    flexWrap: 'wrap',
  },
  run: {
    flexBasis: '24rem',
    flexGrow: 1,
    minWidth: 0,
  },
  runs: {
    gap: spacing.xxs,
    display: 'flex',
    flexDirection: 'column',
  },
  submit: {
    width: '12rem',
  },
});
