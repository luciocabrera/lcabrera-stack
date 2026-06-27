import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  easing,
  shadows,
  spacing,
  transitions,
  typography,
  zIndex,
} from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const modalStyles = stylex.create({
  backdrop: {
    '::backdrop': {
      transition: `opacity ${transitions.normal} ${easing.easeInOut}`,
      backgroundColor: colors.overlay,
    },
  },
  body: {
    padding: spacing.lg,
    gap: spacing.md,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  dialog: {
    padding: 0,
    borderRadius: borderRadius.lg,
    borderStyle: 'none',
    // backgroundColor: colors.surfacePrimary,
    transition: `transform ${transitions.normal} ${easing.easeInOut}`,
    backdropFilter: colors.glassBackdropFilterPrimary,

    backgroundColor: colors.glassBackgroundColorPrimary,
    boxShadow: shadows.xl,
    color: colors.textPrimary,
    textAlign: 'left',
    zIndex: zIndex.modal,
    maxHeight: '85vh',
    maxWidth: '480px',
    width: '90vw',
  },
  footer: {
    padding: spacing.lg,
    gap: spacing.sm,
    display: 'flex',
    justifyContent: 'flex-end',
    borderTopColor: colors.borderSecondary,
    borderTopStyle: 'solid',
    borderTopWidth: '1px',
  },
  header: {
    padding: spacing.lg,
    gap: spacing.sm,
    alignItems: 'flex-start',
    display: 'flex',
    flexShrink: 0,
    justifyContent: 'space-between',
    borderBottomColor: colors.borderSecondary,
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
  },
  title: {
    margin: 0,
    fontSize: typography.fontSizeLg,
    fontWeight: typography.fontWeightSemibold,
  },
});
