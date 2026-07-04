import * as stylex from '@stylexjs/stylex';

import { spacing, typography } from '@repo/ui/design-system/tokens/base.stylex';
import { colors } from '@repo/ui/design-system/tokens/colors.stylex';

/**
 * Shared filter styles reused across filter input components.
 * Similar pattern to @repo/ui/design-system/tokens/commons.stylex for interactive elements.
 *
 * Each filter component imports what it needs and composes with local overrides.
 */
export const filterBaseStyles = stylex.create({
  container: {
    gap: spacing.sm,
    display: 'flex',
    flexDirection: 'column',
  },
  input: {
    padding: `${spacing.xs} ${spacing.sm}`,
    borderColor: {
      default: colors.borderPrimary,
      ':focus-visible': colors.borderFocus,
      ':focus': colors.borderFocus,
    },
    borderRadius: '0.25rem',
    borderStyle: 'solid',
    borderWidth: '1px',
    outline: 'none !important',
    transition: 'border-color 0.15s ease',
    appearance: 'none',
    backgroundColor: colors.surfacePrimary,
    boxShadow: 'none !important',
    boxSizing: 'border-box',
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    outlineOffset: null,
    height: '2.25rem',
    width: '100%',
  },
  inputWrapper: {
    overflow: 'hidden',
    position: 'relative',
    height: '2.25rem',
  },
  inputGroup: {
    gap: spacing.sm,
    alignItems: 'center',
    display: 'flex',
  },
  select: {
    padding: `${spacing.xs} ${spacing.sm}`,
    borderColor: {
      default: colors.borderPrimary,
      ':focus': colors.borderFocus,
    },
    borderRadius: '0.25rem',
    borderStyle: 'solid',
    borderWidth: '1px',
    outline: {
      default: 'revert',
      ':focus': 'none',
    },
    backgroundColor: colors.surfacePrimary,
    color: colors.textPrimary,
    cursor: 'pointer',
    fontSize: typography.fontSizeSm,
  },
  separator: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
  },
});
