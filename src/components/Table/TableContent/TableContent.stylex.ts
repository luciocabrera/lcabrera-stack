import * as stylex from '@stylexjs/stylex';

import { borderRadius, shadows } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  container: {
    flex: '1',
    overflow: 'auto',
    // contain: 'layout style',
    position: 'relative',
    scrollbarColor: `${colors.borderSecondary} transparent`,
    scrollbarWidth: 'thin',
    minHeight: 0,
  },
  containerLocked: {
    pointerEvents: 'none',
    touchAction: 'none',
    overflowY: 'scroll',
  },
  outerContainer: {
    borderColor: colors.borderPrimary,
    borderRadius: borderRadius.lg,
    borderStyle: 'solid',
    borderWidth: '1px',
    flex: '1',
    overflow: 'hidden',
    boxShadow: shadows.sm,
    contain: 'content',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minWidth: 0,
  },
  wrapper: {
    gap: 0,
    overflow: 'hidden',
    containerName: 'table-wrapper',
    containerType: 'size',
    display: 'flex',
    position: 'relative',
    height: '100%',
    width: '100%',
  },
});
