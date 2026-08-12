import * as stylex from '@stylexjs/stylex';

import { spacing } from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

export const sidePanelHeaderStyles = stylex.create({
  header: {
    padding: spacing.lg,
    flexShrink: 0,
    borderBottomColor: colors.borderPrimary,
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
  },
  content: {
    gap: spacing.md,
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
  },
  actions: {
    gap: spacing.sm,
    alignItems: 'center',
    display: 'flex',
  },
});
