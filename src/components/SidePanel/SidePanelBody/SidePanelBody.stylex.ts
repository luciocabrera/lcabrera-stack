import * as stylex from '@stylexjs/stylex';

import { colors } from '@/design-system/tokens/colors.stylex';

export const sidePanelBodyStyles = stylex.create({
  body: {
    flex: '1',
    color: colors.textPrimary,
    scrollbarColor: `${colors.borderSecondary} transparent`,
    scrollbarWidth: 'thin',
    overflowY: 'auto',
  },
});
