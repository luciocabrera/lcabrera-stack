import {
  borderRadius,
  shadows,
} from '@lcabrera/ui/design-system/tokens/base.stylex';
import { colors } from '@lcabrera/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

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
  // Composed onto `outerContainer`, which owns the border and the
  // `overflow: hidden` that clips the scroll area to the rounded corners.
  rounded: {
    borderRadius: borderRadius.lg,
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
