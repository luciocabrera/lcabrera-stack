import { zIndex } from '@repo/ui/design-system/tokens/base.stylex';
import { colors } from '@repo/ui/design-system/tokens/colors.stylex';
import * as stylex from '@stylexjs/stylex';

/**
 * The button is a transparent 8px grab zone straddling the header cell's right
 * border (4px either side, both landing in the 6px inline padding of the cell
 * they overlap, so neither the label nor the actions menu loses clicks). The
 * visible 2px line is painted by `::before` and driven by a custom property:
 * a `:hover` on the pseudo-element itself would only match over the 2px line,
 * not across the whole grab zone.
 */
export const resizeHandleStyles = stylex.create({
  resizeHandle: {
    '--resize-handle-line-color': {
      default: 'transparent',
      ':hover': colors.borderPrimary,
    },
    padding: 0,
    borderStyle: 'none',
    backgroundColor: 'transparent',
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
