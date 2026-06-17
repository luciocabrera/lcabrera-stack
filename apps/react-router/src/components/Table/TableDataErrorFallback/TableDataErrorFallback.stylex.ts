import * as stylex from '@stylexjs/stylex';

import { spacing } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  headerScroller: {
    flex: '0 0 auto',
    backgroundColor: colors.surfacePrimary,
    scrollbarColor: `${colors.borderSecondary} transparent`,
    scrollbarWidth: 'thin',
    borderBottomColor: colors.borderPrimary,
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
    minHeight: '48px',
    overflowX: 'auto',
    overflowY: 'hidden',
  },
  panelArea: {
    padding: spacing.lg,
    flex: '1',
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
    minHeight: 0,
    width: '100%',
  },
  surface: {
    flex: '1',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },
});
