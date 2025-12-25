import * as stylex from '@stylexjs/stylex';

import { spacing } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const sidePanelBodyStyles = stylex.create({
  body: {
    padding: spacing.lg,
    flex: '1',
    color: colors.textPrimary,
    overflowY: 'auto',
  },
});
