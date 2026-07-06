import { spacing } from '@repo/ui/design-system/tokens/base.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  section: {
    flex: '1',
    gap: spacing.md,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },
});
