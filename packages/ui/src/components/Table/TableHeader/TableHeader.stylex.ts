import * as stylex from '@stylexjs/stylex';

import { borderRadius, zIndex } from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

export const tableHeaderStyles = stylex.create({
  container: {
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surfaceSecondary,
    boxShadow: `inset 0 -1px 0 0 ${colors.borderPrimary}`,
    position: 'sticky',
    zIndex: zIndex.sticky,
    left: 0,
    right: 0,
    top: 0,
    width: '100%',
  },
});
