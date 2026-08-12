import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  spacing,
  typography,
} from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';
import { skeleton } from '#ui/design-system/tokens/commons.stylex';
import { surfaceStyles } from '#ui/design-system/tokens/surfaces.stylex';

const localStyles = stylex.create({
  // Layout only — the fill, border and hover come from
  // `surfaceStyles.interactiveCard` in the export below. `overflow: visible`
  // stays local: the filter's popovers escape this box.
  filterItem: {
    overflow: 'visible',
    position: 'relative',
  },
  filterItemHeader: {
    gap: spacing.sm,
    paddingBlock: spacing.xxs,
    paddingInline: spacing.md,
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
    height: '34px',
  },
  filterToggle: {
    padding: 0,
    borderWidth: 0,
    gap: spacing.xs,
    alignItems: 'center',
    backgroundColor: 'transparent',
    color: colors.textPrimary,
    cursor: 'pointer',
    display: 'flex',
    flexGrow: 1,
    fontSize: typography.fontSizeSm,
  },
  filterToggleIcon: {
    color: colors.textSecondary,
    flexShrink: 0,
    fontSize: typography.fontSizeXs,
  },
  filterItemLabel: {
    color: colors.textPrimary,
    flexGrow: 1,
    fontSize: typography.fontSizeSm,
    fontWeight: 500,
    textAlign: 'left',
  },
  invalidBadge: {
    color: colors.error,
    fontSize: typography.fontSizeXs,
    fontWeight: 600,
  },
  filterItemContent: {
    padding: spacing.md,
    backgroundColor: colors.glassBackgroundColorSecondary,
    borderBottomLeftRadius: borderRadius.md,
    borderBottomRightRadius: borderRadius.md,
    borderTopColor: colors.borderPrimary,
    borderTopStyle: 'solid',
    borderTopWidth: '1px',
  },
  busyOverlay: {
    borderRadius: borderRadius.md,
    insetBlock: 0,
    insetInline: 0,
  },
});

export const styles = {
  busyOverlay: [skeleton.loadingOverlay, localStyles.busyOverlay],
  busyWave: skeleton.shimmerWave,
  filterItem: { ...surfaceStyles.interactiveCard, ...localStyles.filterItem },
  filterItemContent: localStyles.filterItemContent,
  filterItemHeader: localStyles.filterItemHeader,
  filterItemLabel: localStyles.filterItemLabel,
  filterToggle: localStyles.filterToggle,
  filterToggleIcon: localStyles.filterToggleIcon,
  invalidBadge: localStyles.invalidBadge,
};
