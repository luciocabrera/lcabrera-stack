import * as stylex from '@stylexjs/stylex';

import { borderRadius, shadows } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  container: {
    flex: '1',
    overflowX: 'scroll',
    overflowY: 'auto',
    position: 'relative',
    scrollbarColor: `${colors.borderSecondary} transparent`,
    scrollbarGutter: 'stable',
    scrollbarWidth: 'thin',
    minHeight: 0,
  },
  containerLocked: {
    overflowX: 'scroll',
    overflowY: 'scroll',
    pointerEvents: 'none',
    scrollbarGutter: 'stable',
    touchAction: 'none',
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
