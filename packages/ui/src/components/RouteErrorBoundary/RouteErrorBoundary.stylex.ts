import { spacing } from '@lcabrera/ui/design-system/tokens/base.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  container: {
    padding: spacing.xl,
    flex: '1',
    gap: spacing.md,
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    textAlign: 'center',
    height: '-webkit-fill-available',
  },
  actions: {
    gap: spacing.md,
    display: 'flex',
    width: 'min(500px, 90%)',
  },
});
