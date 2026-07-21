import {
  borderRadius,
  spacing,
  typography,
} from '@lcabrera/ui/design-system/tokens/base.stylex';
import { colors } from '@lcabrera/ui/design-system/tokens/colors.stylex';
import { skeleton } from '@lcabrera/ui/design-system/tokens/commons.stylex';
import * as stylex from '@stylexjs/stylex';

export const styles = stylex.create({
  label: {
    margin: 0,
    flex: '1 1 0',
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    fontWeight: typography.fontWeightNormal,
    minWidth: 0,
  },
  row: {
    gap: spacing.sm,
    alignItems: 'flex-start',
    display: 'flex',
    position: 'relative',
    minWidth: 0,
    width: '100%',
  },
  rows: {
    margin: 0,
    padding: 0,
    gap: spacing.sm,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    overflowX: 'hidden',
    width: '100%',
  },
  value: {
    margin: 0,
    flex: '1 1 0',
    color: colors.textPrimary,
    fontSize: typography.fontSizeSm,
    fontWeight: typography.fontWeightSemibold,
    overflowWrap: 'anywhere',
    textAlign: 'right',
    wordBreak: 'break-word',
    minWidth: 0,
  },
  busyOverlay: {
    borderRadius: borderRadius.sm,
    insetBlock: 0,
    insetInline: 0,
  },
});

export const busyStyles = {
  overlay: [skeleton.loadingOverlay, styles.busyOverlay],
  wave: skeleton.shimmerWave,
};
