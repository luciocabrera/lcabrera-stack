import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  spacing,
  typography,
} from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';
import { skeleton } from '@/design-system/tokens/commons.stylex';

export const styles = stylex.create({
  label: {
    color: colors.textSecondary,
    flex: '1 1 0',
    fontSize: typography.fontSizeSm,
    fontWeight: typography.fontWeightNormal,
    margin: 0,
    minWidth: 0,
  },
  row: {
    alignItems: 'flex-start',
    display: 'flex',
    gap: spacing.sm,
    minWidth: 0,
    position: 'relative',
    width: '100%',
  },
  rows: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
    margin: 0,
    minWidth: 0,
    overflowX: 'hidden',
    padding: 0,
    width: '100%',
  },
  value: {
    color: colors.textPrimary,
    flex: '1 1 0',
    fontSize: typography.fontSizeSm,
    fontWeight: typography.fontWeightSemibold,
    margin: 0,
    minWidth: 0,
    overflowWrap: 'anywhere',
    textAlign: 'right',
    wordBreak: 'break-word',
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
