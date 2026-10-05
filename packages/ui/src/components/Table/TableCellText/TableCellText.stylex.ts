import * as stylex from '@stylexjs/stylex';

import { typography } from '#ui/design-system/tokens/base.stylex';

export const styles = stylex.create({
  bold: {
    fontWeight: typography.fontWeightBold,
  },
  monospace: {
    fontFamily: typography.fontFamilyMono,
  },
});
