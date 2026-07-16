import { spacing } from '@repo/ui/design-system/tokens/base.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  buttonRow: {
    gap: spacing.xs,
    display: 'flex',
  },
  iconLeft: {
    alignItems: 'center',
    display: 'inline-flex',
    marginRight: spacing.xs,
  },
  iconRight: {
    alignItems: 'center',
    display: 'inline-flex',
    marginLeft: spacing.xs,
  },
  panelContent: {
    marginTop: spacing.md,
  },
});
