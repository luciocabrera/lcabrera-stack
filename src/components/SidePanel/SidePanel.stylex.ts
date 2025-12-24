import * as stylex from '@stylexjs/stylex';

import { easing, shadows, transitions } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

const baseStyles = stylex.create({
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    bottom: 0,
    left: 0,
    position: 'fixed',
    right: 0,
    top: 0,
    transition: `opacity ${transitions.normal} ${easing.easeInOut}`,
    zIndex: 1000,
  },

  overlayHidden: {
    opacity: 0,
    pointerEvents: 'none',
  },

  overlayVisible: {
    opacity: 1,
  },

  panel: {
    backgroundColor: colors.surfacePrimary,
    borderColor: colors.borderPrimary,
    bottom: 0,
    boxShadow: shadows.xl,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'fixed',
    top: 0,
    transition: `transform ${transitions.normal} ${easing.easeInOut}`,
    zIndex: 1001,
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
