import * as stylex from '@stylexjs/stylex';

import { spacing } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const sidePanelBodyStyles = stylex.create({
  body: {
    color: colors.textPrimary,
    flex: '1',
    overflowY: 'auto',
    padding: spacing.lg,
  },
});
