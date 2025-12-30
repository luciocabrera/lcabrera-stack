import * as stylex from '@stylexjs/stylex';

import { borderRadius, shadows } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  container: {
    borderColor: colors.borderPrimary,
    borderRadius: borderRadius.lg,
    borderStyle: 'solid',
    borderWidth: '1px',
    overflow: 'auto',
    boxShadow: shadows.sm,
    scrollbarColor: `${colors.borderSecondary} transparent`,
    scrollbarWidth: 'thin',
    height: '100%',
    width: '100%',
  },
});
