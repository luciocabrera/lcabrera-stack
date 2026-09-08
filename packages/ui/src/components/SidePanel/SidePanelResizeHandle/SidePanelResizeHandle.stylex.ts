import * as stylex from '@stylexjs/stylex';

import { zIndex } from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  handle: {
    '--side-panel-resize-line-color': {
      default: 'transparent',
      ':focus-visible': colors.borderPrimary,
      ':hover': colors.borderPrimary,
    },
    padding: 0,
    borderStyle: 'none',
    borderWidth: 0,
    appearance: 'none',
    backgroundColor: 'transparent',
    cursor: 'col-resize',
    position: 'absolute',
    touchAction: 'none',
    userSelect: 'none',
    zIndex: zIndex.sticky + 1,
    bottom: 0,
    top: 0,
    width: 10,
    '::before': {
      transition: 'background-color 0.15s ease',
      backgroundColor: 'var(--side-panel-resize-line-color)',
      content: '',
      position: 'absolute',
      bottom: 0,
      left: 4,
      top: 0,
      width: 2,
    },
  },
  handleActive: {
    '--side-panel-resize-line-color': colors.borderPrimary,
  },
  left: {
    left: 'auto',
    right: -5,
  },
  right: {
    left: -5,
    right: 'auto',
  },
});
