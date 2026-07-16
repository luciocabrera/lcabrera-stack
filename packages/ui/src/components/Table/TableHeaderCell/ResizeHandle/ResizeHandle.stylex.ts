import { zIndex } from '@repo/ui/design-system/tokens/base.stylex';
import { colors } from '@repo/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

export const resizeHandleStyles = stylex.create({
  resizeHandle: {
    padding: 0,
    borderStyle: 'none',
    alignItems: 'center',
    backgroundColor: {
      default: 'transparent',
      ':hover': colors.borderPrimary,
    },
    cursor: 'col-resize',
    display: 'flex',
    justifyContent: 'center',
    position: 'absolute',
    touchAction: 'none',
    userSelect: 'none',
    zIndex: zIndex.sticky + 1,
    bottom: 0,
    right: 0,
    top: 0,
    width: 2,
  },
  resizeHandleActive: {
    backgroundColor: colors.borderPrimary,
  },
});
