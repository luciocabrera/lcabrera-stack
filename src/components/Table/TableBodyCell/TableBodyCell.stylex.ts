import * as stylex from '@stylexjs/stylex';

import { borderRadius, typography } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const tableBodyCellStyles = stylex.create({
  alignCenter: {
    justifyContent: 'center',
    textAlign: 'center',
  },
  alignRight: {
    justifyContent: 'flex-end',
    textAlign: 'right',
  },
  base: (minWidth?: number | string, width?: number | string) => ({
    flex: '1 1 0%',
    paddingBlock: 'var(--table-padding-block)',
    paddingInline: 'var(--table-padding-inline)',
    alignItems: 'center',
    color: colors.textPrimary,
    display: 'flex',
    fontSize: typography.fontSizeSm,
    fontWeight: typography.fontWeightNormal,
    minWidth: minWidth ?? null,
    width: width ?? null,
  }),
  checkbox: {
    borderColor: colors.borderPrimary,
    borderRadius: borderRadius.sm,
    borderStyle: 'solid',
    borderWidth: 1,
    alignItems: 'center',
    backgroundColor: 'transparent',
    color: colors.textPrimary,
    display: 'flex',
    justifyContent: 'center',
    height: 16,
    width: 16,
  },
  checkboxChecked: {
    borderColor: colors.brandPrimary,
    backgroundColor: colors.brandPrimary,
    color: colors.textInverse,
  },
});
