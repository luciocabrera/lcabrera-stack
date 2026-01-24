import * as stylex from '@stylexjs/stylex';

import { typography } from '@/design-system/tokens/base.stylex';
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
    paddingInline: '6px', 
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
  booleanContent: {
    width: 'auto',
  },
  textContent: {
    overflow: 'hidden',
    display: 'block',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    width: '100%',
  },
});

export const skelletonStyles = { ...skelleton };
