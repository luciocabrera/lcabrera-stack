import * as stylex from '@stylexjs/stylex';

import { colors } from '@/design-system/tokens/colors.stylex';

export const tableHeaderStyles = stylex.create({
  container: {
    backgroundColor: colors.surfaceSecondary,
    // Use box-shadow instead of border for sticky headers to avoid visual glitches
    boxShadow: `inset 0 -1px 0 0 ${colors.borderPrimary}`,
    position: 'sticky',
    zIndex: 10,
    left: 0,
    right: 0,
    top: 0,
    width: '100%',
  },
});
