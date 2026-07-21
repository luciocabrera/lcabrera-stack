import { colors } from '@lcabrera/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

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
