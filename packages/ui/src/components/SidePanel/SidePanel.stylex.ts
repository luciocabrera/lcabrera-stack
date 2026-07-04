import * as stylex from '@stylexjs/stylex';

import {
  easing,
  shadows,
  transitions,
  zIndex,
} from '@repo/ui/design-system/tokens/base.stylex';
import { colors } from '@repo/ui/design-system/tokens/colors.stylex';

const baseStyles = stylex.create({
  dialog: {
    margin: 0,
    padding: 0,
    borderColor: 'transparent',
    borderStyle: 'none',
    borderWidth: 0,
    overflow: 'hidden',
    transition: `transform ${transitions.normal} ${easing.easeInOut}`,
    backdropFilter: colors.glassBackdropFilterPrimary,
    backgroundColor: colors.glassBackgroundColorPrimary, // '#0000002b', // '#00000047', // '#00000029', // colors.surfacePrimary,
    boxShadow: shadows.xl,
    containerName: 'side-panel',
    containerType: 'inline-size',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    zIndex: zIndex.sticky,
    bottom: 0,
    height: '100vh',
    maxHeight: 'none',
    maxWidth: 'none',
    top: 0,
  },

  pinned: {
    overflow: 'hidden',
    boxShadow: shadows.xl,
    flexShrink: 0,
    position: 'relative',
    zIndex: 'auto',
    borderLeftColor: colors.borderPrimary,
    borderLeftStyle: 'solid',
    borderLeftWidth: '1px',
    height: '100%',
  },

  // Style the native backdrop
  withBackdrop: {
    '::backdrop': {
      transition: `opacity ${transitions.normal} ${easing.easeInOut}`,
      backgroundColor: colors.overlay,
    },
  },

  withoutBackdrop: {
    '::backdrop': {
      backgroundColor: 'transparent',
    },
  },

  content: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
  },
});

const positionVariants = stylex.create({
  left: {
    borderRightStyle: 'solid',
    borderRightWidth: '1px',
    left: 0,
    right: 'auto',
  },

  leftClosed: {
    transform: 'translateX(-100%)',
  },

  leftOpen: {
    transform: 'translateX(0)',
  },

  right: {
    borderLeftStyle: 'solid',
    borderLeftWidth: '1px',
    left: 'auto',
    right: 0,
  },

  rightClosed: {
    transform: 'translateX(100%)',
  },

  rightOpen: {
    transform: 'translateX(0)',
  },
});

const sizeVariants = stylex.create({
  lg: {
    width: '32rem', // 512px
  },
  md: {
    width: '26rem', // 416px
  },
  rail: {
    width: '4.5rem', // 72px
  },
  sm: {
    width: '20rem', // 320px
  },
  xs: {
    width: '16rem', // 256px
  },
  xxs: {
    width: '2.5rem', // 40px
  },
});

export const sidePanelStyles = {
  base: baseStyles.dialog,
  pinned: baseStyles.pinned,
  withBackdrop: baseStyles.withBackdrop,
  withoutBackdrop: baseStyles.withoutBackdrop,
  content: baseStyles.content,
  position: positionVariants,
  size: sizeVariants,
};
