import {
  borderRadius,
  spacing,
  typography,
} from '@lcabrera/ui/design-system/tokens/base.stylex';
import { colors } from '@lcabrera/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  controls: {
    gap: spacing.xs,
    alignItems: 'center',
    display: 'flex',
    marginBottom: spacing.md,
  },
  delayLabel: {
    alignSelf: 'center',
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
  },
  tableContainer: {
    borderRadius: borderRadius.md,
    boxSizing: 'border-box',
    display: 'flex',
    height: '400px',
    maxWidth: '100%',
  },
});
