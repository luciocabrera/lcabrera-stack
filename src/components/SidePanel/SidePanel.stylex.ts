import * as stylex from '@stylexjs/stylex';

import { easing, shadows, transitions } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

const baseStyles = stylex.create({
  overlay: {
    transition: `opacity ${transitions.normal} ${easing.easeInOut}`,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    position: 'fixed',
    zIndex: 1000,
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
  },

  overlayHidden: {
    opacity: 0,
    pointerEvents: 'none',
  },

  overlayVisible: {
    opacity: 1,
  },

  panel: {
    borderColor: colors.borderPrimary,
    overflow: 'hidden',
    transition: `transform ${transitions.normal} ${easing.easeInOut}`,
    backgroundColor: colors.surfacePrimary,
    boxShadow: shadows.xl,
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    zIndex: 1001,
    bottom: 0,
    top: 0,
  },
});

const positionVariants = stylex.create({
  left: {
    borderRightStyle: 'solid',
    borderRightWidth: '1px',
    left: 0,
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
  base: baseStyles.panel,
  overlay: baseStyles.overlay,
  overlayHidden: baseStyles.overlayHidden,
  overlayVisible: baseStyles.overlayVisible,
  position: positionVariants,
  size: sizeVariants,
};
