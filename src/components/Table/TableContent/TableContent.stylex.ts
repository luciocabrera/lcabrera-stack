import * as stylex from '@stylexjs/stylex';

import { borderRadius, shadows } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  wrapper: {
    display: 'flex',
    height: '100%',
    width: '100%',
    position: 'relative',
    gap: 0,
    containerName: 'table-wrapper',
    containerType: 'size',
    overflow: 'hidden',
  },
  outerContainer: {
    borderColor: colors.borderPrimary,
    borderRadius: borderRadius.lg,
    borderStyle: 'solid',
    borderWidth: '1px',
    overflow: 'hidden',
    boxShadow: shadows.sm,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    flex: '1',
    minWidth: 0,
  },
  container: {
    flex: '1',
    overflow: 'auto',
    position: 'relative',
    scrollbarColor: `${colors.borderSecondary} transparent`,
    scrollbarWidth: 'thin',
    minHeight: 0,
  },
});
