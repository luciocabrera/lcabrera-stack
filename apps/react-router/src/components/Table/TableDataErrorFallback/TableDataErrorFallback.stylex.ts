import * as stylex from '@stylexjs/stylex';

import { spacing } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  headerScroller: {
    backgroundColor: colors.surfacePrimary,
    borderBottomColor: colors.borderPrimary,
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
    flex: '0 0 auto',
    minHeight: '48px',
    overflowX: 'auto',
    overflowY: 'hidden',
    scrollbarColor: `${colors.borderSecondary} transparent`,
    scrollbarWidth: 'thin',
  },
  panelArea: {
    alignItems: 'center',
    display: 'flex',
    flex: 1,
    justifyContent: 'center',
    minHeight: 0,
    padding: spacing.lg,
    width: '100%',
  },
  surface: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    minHeight: 0,
    overflow: 'hidden',
  },
});
