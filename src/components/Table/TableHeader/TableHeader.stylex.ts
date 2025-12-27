import * as stylex from '@stylexjs/stylex';

import { colors } from '@/design-system/tokens/colors.stylex';

export const tableHeaderStyles = stylex.create({
  container: {
    backgroundColor: colors.surfaceSecondary,
    position: 'relative',
    zIndex: 1,
    borderBottomColor: colors.borderPrimary,
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
    width: '100%',
  },
  sticky: {
    backgroundColor: colors.surfaceSecondary,
    position: 'sticky',
    zIndex: 10,
    left: 0,
    right: 0,
    top: 0,
  },
});
