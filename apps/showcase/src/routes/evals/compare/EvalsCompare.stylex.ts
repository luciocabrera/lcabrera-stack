import { spacing } from '@lcabrera/ui/design-system/tokens/base.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  branchForm: {
    gap: spacing.md,
    alignItems: 'end',
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 20rem) 12rem',
  },
  pickerForm: {
    gap: spacing.md,
    alignItems: 'end',
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr)) 12rem',
  },
  runs: {
    gap: spacing.xxs,
    display: 'flex',
    flexDirection: 'column',
  },
});
