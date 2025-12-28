import * as stylex from '@stylexjs/stylex';

import {
  easing,
  shadows,
  transitions,
} from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

const baseStyles = stylex.create({
  dialog: {
    margin: 0,
    padding: 0,
    // Reset default dialog styles
    borderColor: 'transparent',
    borderStyle: 'none',
    borderWidth: 0,

    overflow: 'hidden',
    transition: `transform ${transitions.normal} ${easing.easeInOut}`,
    // Custom styles
    backgroundColor: colors.surfacePrimary,
    boxShadow: shadows.xl,
    containerName: 'side-panel',
    containerType: 'inline-size',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    zIndex: 1001,
    bottom: 0,
    height: '100vh',
    maxHeight: 'none',
    maxWidth: 'none',
    top: 0,
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
    width: '28rem', // 448px
  },

  md: {
    width: '20rem', // 320px
  },

  sm: {
    width: '16rem', // 256px
  },
});

export const sidePanelStyles = {
  base: baseStyles.dialog,
  withBackdrop: baseStyles.withBackdrop,
  withoutBackdrop: baseStyles.withoutBackdrop,
  content: baseStyles.content,
  position: positionVariants,
  size: sizeVariants,
};
