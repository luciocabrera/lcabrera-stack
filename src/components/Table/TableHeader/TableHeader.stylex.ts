import * as stylex from '@stylexjs/stylex';

import { colors } from '@/design-system/tokens/colors.stylex';

export const tableHeaderStyles = stylex.create({
  container: {
    backgroundColor: colors.surfaceSecondary,
    position: 'sticky',
    zIndex: 10,
    borderBottomColor: colors.borderPrimary,
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
    left: 0,
    right: 0,
    top: 0,
    width: '100%',
  },
});
