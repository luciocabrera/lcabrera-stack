import * as stylex from '@stylexjs/stylex';

import { borderRadius } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const tableCheckDisplayStyles = stylex.create({
  container: {
    display: 'inline-flex',
    position: 'relative',
  },
  checkbox: {
    borderColor: colors.borderPrimary,
    borderRadius: borderRadius.sm,
    borderStyle: 'solid',
    borderWidth: 1,
    alignItems: 'center',
    appearance: 'none',
    backgroundColor: 'transparent',
    color: colors.textPrimary,
    display: 'flex',
    justifyContent: 'center',
    height: 16,
    width: 16,
  },
  checkboxChecked: {
    backgroundColor: colors.brandSecondary,
    color: colors.brandPrimaryText,
  },
  checkIconContainer: {
    alignItems: 'center',
    color: colors.brandPrimaryText,
    display: 'flex',
    inset: 0,
    justifyContent: 'center',
    pointerEvents: 'none',
    position: 'absolute',
  },
});
