import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  shadows,
} from '@repo/ui/design-system/tokens/base.stylex';
import { colors } from '@repo/ui/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  container: {
    scrollbarGutter: 'stable',
    flex: '1',
    position: 'relative',
    scrollbarColor: `${colors.borderSecondary} transparent`,
    scrollbarWidth: 'thin',
    minHeight: 0,
    overflowX: 'scroll',
    overflowY: 'auto',
  },
  containerLocked: {
    scrollbarGutter: 'stable',
    pointerEvents: 'none',
    touchAction: 'none',
    overflowX: 'scroll',
    overflowY: 'scroll',
  },
  sentinel: {
    pointerEvents: 'none',
    position: 'sticky',
    height: '1px',
    left: 0,
    width: '1px',
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
