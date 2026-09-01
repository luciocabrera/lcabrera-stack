import * as stylex from '@stylexjs/stylex';

import { zIndex } from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

export const resizeHandleStyles = stylex.create({
  resizeHandle: {
    '--resize-handle-line-color': {
      default: 'transparent',
      ':focus-visible': colors.borderPrimary,
      ':hover': colors.borderPrimary,
    },
    cursor: 'col-resize',
    position: 'absolute',
    touchAction: 'none',
    userSelect: 'none',
    zIndex: zIndex.sticky + 1,
    bottom: 0,
    right: -4,
    top: 0,
    width: 8,
    '::before': {
      transition: 'background-color 0.15s ease',
      backgroundColor: 'var(--resize-handle-line-color)',
      content: '',
      position: 'absolute',
      bottom: 0,
      left: 3,
      top: 0,
      width: 2,
    },
  },
  resizeHandleActive: {
    '--resize-handle-line-color': colors.borderPrimary,
  },
});
