import * as stylex from '@stylexjs/stylex';

import { spacing, typography } from '@repo/ui/design-system/tokens/base.stylex';
import { colors } from '@repo/ui/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  browseButton: {
    flexShrink: 0,
  },
  container: {
    paddingInlineEnd: spacing.xxs,
    borderColor: {
      default: colors.borderPrimary,
      ':focus-within': colors.borderFocus,
    },
    borderRadius: '0.25rem',
    borderStyle: 'solid',
    borderWidth: '1px',
    alignItems: 'center',
    backgroundColor: colors.surfacePrimary,
    boxSizing: 'border-box',
    display: 'flex',
    gap: spacing.xxs,
    height: '2.25rem',
    width: '100%',
  },
  input: {
    padding: `0 ${spacing.sm}`,
    borderStyle: 'none',
    outline: 'none !important',
    backgroundColor: 'transparent',
    boxShadow: 'none !important',
    color: colors.textPrimary,
    flexGrow: 1,
    fontSize: typography.fontSizeSm,
    height: '100%',
    minWidth: 0,
  },
});
