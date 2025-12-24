import * as stylex from '@stylexjs/stylex';

import { spacing } from '@/design-system/tokens/base.stylex';

export const sidePanelBodyStyles = stylex.create({
  body: {
    padding: spacing.lg,
    flex: '1',
    overflowY: 'auto',
  },
});
