import {
  borderRadius,
  spacing,
} from '@lcabrera/ui/design-system/tokens/base.stylex';
import { colors } from '@lcabrera/ui/design-system/tokens/colors.stylex';
import { skeleton } from '@lcabrera/ui/design-system/tokens/commons.stylex';
import { surfaceStyles } from '@lcabrera/ui/design-system/tokens/surfaces.stylex';
import * as stylex from '@stylexjs/stylex';

const localStyles = stylex.create({
  // Layout and interaction only — the fill, border and hover come from
  // `surfaceStyles.interactiveCard` in the export below.
  item: {
    // `default` restates the recipe's border colour deliberately. A value-level
    // conditional compiles to one `borderColor` key, so this object replaces the
    // recipe's outright; drop the `default` entry and the resting border
    // disappears while the focus ring goes on working.
    borderColor: {
      default: colors.borderPrimary,
      ':focus-visible': colors.brandPrimary,
    },
    gap: spacing.sm,
    outline: {
      default: 'none',
      ':focus-visible': `2px solid ${colors.brandPrimary}`,
    },
    paddingBlock: spacing.xxs,
    paddingInline: spacing.md,
    alignItems: 'center',
    cursor: {
      default: 'grab',
      ':active': 'grabbing',
    },
    display: 'flex',
    outlineOffset: {
      default: '0px',
      ':focus-visible': '2px',
    },
    position: 'relative',
    userSelect: 'none',
    height: '34px',
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

export const styles = {
  ...localStyles,
  item: { ...surfaceStyles.interactiveCard, ...localStyles.item },
};

export const busyStyles = {
  overlay: [skeleton.loadingOverlay, localStyles.busyOverlay],
  wave: skeleton.shimmerWave,
};
