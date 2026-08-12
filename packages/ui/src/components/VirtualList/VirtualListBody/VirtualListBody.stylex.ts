import * as stylex from '@stylexjs/stylex';

import { borderRadius, spacing } from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  optionsList: {
    borderColor: colors.borderPrimary,
    borderRadius: borderRadius.md,
    borderStyle: 'solid',
    borderWidth: '1px',
    gap: spacing.xs,
    overflow: 'hidden',
    backgroundColor: colors.surfacePrimary,
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    maxWidth: '100%',
    minWidth: 0,
    width: '100%',
  },
  optionsListFill: {
    flex: '1',
    overflow: 'hidden',
    minHeight: 0,
  },
  sentinel: {
    pointerEvents: 'none',
    height: '1px',
    width: '1px',
  },
  /**
   * `overscrollBehavior: contain` stops a scroll that has reached either end of
   * the list from chaining to whatever scrolls behind it. Behind a floating
   * dropdown that is the drawer or form body, and an ancestor scroll dismisses
   * the dropdown — so without this, reaching the last option closes the list.
   */
  virtualContainer: (height: string) => ({
    overscrollBehavior: 'contain',
    position: 'relative',
    height,
    overflowX: 'hidden',
    overflowY: 'auto',
  }),
  virtualContainerFill: {
    flex: '1',
    overscrollBehavior: 'contain',
    position: 'relative',
    overflowX: 'hidden',
    overflowY: 'auto',
  },
});
