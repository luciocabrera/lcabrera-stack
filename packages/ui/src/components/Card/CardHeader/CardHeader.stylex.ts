import * as stylex from '@stylexjs/stylex';

import { spacing } from '@repo/ui/design-system/tokens/base.stylex';
import { colors } from '@repo/ui/design-system/tokens/colors.stylex';

export const cardHeaderStyles = stylex.create({
  header: {
    padding: spacing.lg,
    borderBottomColor: colors.borderPrimary,
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
  },
});
