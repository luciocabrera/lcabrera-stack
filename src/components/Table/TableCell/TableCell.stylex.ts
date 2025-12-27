import * as stylex from '@stylexjs/stylex';

import { typography } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const tableCellStyles = stylex.create({
  base: {
    flex: '1 1 0%',
    color: colors.textPrimary,
    display: 'flex',
    fontSize: typography.fontSizeSm,
    fontWeight: typography.fontWeightNormal,
    minWidth: 0,
  },
  alignCenter: {
    justifyContent: 'center',
    textAlign: 'center',
  },
  alignRight: {
    justifyContent: 'flex-end',
    textAlign: 'right',
  },
  header: {
    color: colors.textSecondary,
    fontWeight: typography.fontWeightSemibold,
  },
  stickyHeader: {
    backgroundColor: colors.surfaceSecondary,
    position: 'sticky',
    zIndex: 10,
    top: 0,
  },
});
