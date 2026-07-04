import * as stylex from '@stylexjs/stylex';

import { colors } from '@repo/ui/design-system/tokens/colors.stylex';

export const sidePanelBodyStyles = stylex.create({
  body: {
    flex: '1',
    color: colors.textPrimary,
    containerName: 'SidePanelBody',
    containerType: 'inline-size',
    scrollbarColor: `${colors.borderSecondary} transparent`,
    scrollbarWidth: 'thin',
    overflowX: 'hidden',
    overflowY: 'auto',
  },
});
