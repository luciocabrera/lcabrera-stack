import * as stylex from '@stylexjs/stylex';

import { borderRadius } from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  container: {
    scrollbarColor: `${colors.borderSecondary} transparent`,
    scrollbarWidth: 'thin',
    maxWidth: '100%',
    overflowX: 'auto',
    overflowY: 'hidden',
  },
  rounded: {
    borderRadius: borderRadius.lg,
  },
  wrapper: {
    borderColor: colors.borderPrimary,
    borderStyle: 'solid',
    borderWidth: '1px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    minWidth: 0,
    width: '100%',
  },
});
