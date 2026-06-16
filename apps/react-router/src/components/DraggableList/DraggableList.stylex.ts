import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  spacing,
  transitions,
} from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';
import { skeleton } from '@/design-system/tokens/commons.stylex';

export const styles = stylex.create({
  list: {
    margin: 0,
    padding: 0,
    gap: spacing.sm,
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
  },
  item: {
    borderColor: {
      default: colors.borderPrimary,
      ':focus-visible': colors.brandPrimary,
    },
    borderRadius: borderRadius.md,
    borderStyle: 'solid',
    borderWidth: '1px',
    gap: spacing.sm,
    outline: {
      default: 'none',
      ':focus-visible': `2px solid ${colors.brandPrimary}`,
    },
    paddingBlock: spacing.xxs,
    paddingInline: spacing.md,
    transition: `background-color ${transitions.fast}, border-color ${transitions.fast}`,
    alignItems: 'center',
    backgroundColor: {
      default: colors.surfaceSecondary,
      ':hover': colors.surfaceElevated,
    },
    cursor: {
      default: 'grab',
      ':active': 'grabbing',
    },
    display: 'flex',
    outlineOffset: {
      default: '0px',
      ':focus-visible': '2px',
    },
    userSelect: 'none',
    height: '34px',
    position: 'relative',
  },
  itemDragging: {
    cursor: 'grabbing',
    opacity: 0.5,
  },
  itemNotDraggable: {
    cursor: 'default',
  },
  itemDragOver: {
    borderColor: colors.brandPrimary,
    borderStyle: 'dashed',
  },
  dragHandle: {
    color: colors.textTertiary,
    cursor: {
      default: 'grab',
      ':active': 'grabbing',
    },
    flexShrink: 0,
    fontSize: '1.25rem',
    lineHeight: 1,
  },
  content: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  busyOverlay: {
    borderRadius: borderRadius.md,
    insetBlock: 0,
    insetInline: 0,
  },
});

export const busyStyles = {
  overlay: [skeleton.loadingOverlay, styles.busyOverlay],
  wave: skeleton.shimmerWave,
};
