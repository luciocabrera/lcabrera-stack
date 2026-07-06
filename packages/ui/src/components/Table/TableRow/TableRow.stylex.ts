import {
  borderRadius,
  spacing,
} from '@repo/ui/design-system/tokens/base.stylex';
import { colors } from '@repo/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

export const tableRowStyles = stylex.create({
  base: {
    alignItems: 'center',
    backgroundColor: colors.surfacePrimary,
    display: 'flex',
    borderBottomColor: colors.borderSecondary,
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
    height: spacing.xl,
    maxHeight: spacing.xl,
    minHeight: spacing.xl,
    width: '100%',
  },
  header: {
    padding: 0,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceSecondary,
    height: 40,
  },
  striped: {
    backgroundColor: { ':nth-child(even)': colors.backgroundSecondary },
  },
});
