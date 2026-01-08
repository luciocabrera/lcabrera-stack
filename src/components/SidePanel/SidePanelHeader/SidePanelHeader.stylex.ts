import * as stylex from '@stylexjs/stylex';

import { spacing } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const sidePanelHeaderStyles = stylex.create({
  header: {
    padding: spacing.lg,
    flexShrink: 0,
    borderBottomColor: colors.borderPrimary,
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
