import * as stylex from '@stylexjs/stylex';

import { borderRadius, typography } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';
import { skelleton } from '@/design-system/tokens/commons.stylex';

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
    borderColor: 'green',
    borderStyle: 'solid',
    paddingInline: '6px', // 'var(--table-padding-inline)',
    alignItems: 'center',
    color: colors.textPrimary,
    display: 'flex',
    fontSize: typography.fontSizeSm,
    fontWeight: typography.fontWeightNormal,
    position: 'relative',
    height: '100%',
    maxHeight: '100%',
    maxWidth: width ?? minWidth ?? null,
    minWidth: minWidth ?? width ?? null,
    width: width ?? minWidth ?? null,
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
    color: colors.brandPrimaryText,
  },
  /** Text content with ellipsis overflow */
  textContent: {
    overflow: 'hidden',
    alignItems: 'center',
    display: 'block',
    justifyContent: 'flex-start',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    width: '100%',
  }
});


export const skelletonStyles = { ...skelleton };