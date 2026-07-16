import { spacing } from '@repo/ui/design-system/tokens/base.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  sectionHeader: {
    paddingBlock: spacing.xs,
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'flex-end',
  },
});
