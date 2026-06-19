import * as stylex from '@stylexjs/stylex';

import { borderRadius } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  container: {
    display: 'inline-flex',
    position: 'relative',
  },
  iconContainer: {
    inset: 0,
    alignItems: 'center',
    color: colors.brandPrimaryText,
    display: 'flex',
    justifyContent: 'center',
    pointerEvents: 'none',
    position: 'absolute',
  },
  input: {
    borderColor: colors.borderPrimary,
    borderRadius: borderRadius.sm,
    borderStyle: 'solid',
    borderWidth: 1,
    alignItems: 'center',
    appearance: 'none',
    backgroundColor: 'transparent',
    color: colors.textPrimary,
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'center',
    height: 16,
    width: 16,
  },
  inputChecked: {
    color: colors.brandPrimaryText,
  },
  inputDisabled: {
    cursor: 'not-allowed',
  },
});
