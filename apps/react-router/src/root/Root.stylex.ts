import * as stylex from '@stylexjs/stylex';

import { typography } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  appShell: {
    flex: '1 1 auto',
    display: 'flex',
    minHeight: 0,
  },
  base: {
    overflow: 'hidden',
    transition: 'background-color 0.3s ease, color 0.3s ease',
    backgroundColor: colors.backgroundPrimary,
    color: colors.textPrimary,
    display: 'flex',
    flexDirection: 'column',
    fontFamily: typography.fontFamily,
    height: '100vh',
    maxWidth: '100dvw',
  },
  outletWrapper: {
    flex: '1 1 auto',
    scrollbarColor: `${colors.borderSecondary} transparent`,
    scrollbarWidth: 'thin',
    minHeight: 0,
    overflowY: 'auto',
  },
  panel: {
    backgroundColor: '#04070f', //  this must be for the light theme #ffffff00
    display: 'flex',
    isolation: 'isolate',
    justifyContent: 'center',
    position: 'relative',
    height: '100%',
    width: '100%',
  },
  overlay: {
    inset: 0,
    backgroundColor: colors.backgroundPrimary, //    '#050814',
    backgroundImage:
      'radial-gradient(46% 52% at 18% 25%, rgba(90, 144, 255, 0.95), transparent 71%), radial-gradient(44% 44% at 82% 24%, rgba(40, 228, 194, 0.86), transparent 71%), radial-gradient(52% 56% at 84% 82%, rgba(196, 120, 255, 0.84), transparent 73%), radial-gradient(40% 40% at 53% 62%, rgba(126, 158, 255, 0.64), transparent 74%)',
    filter: 'blur(72px) saturate(150%) brightness(0.5)',
    mixBlendMode: 'screen',
    opacity: 0.5,
    pointerEvents: 'none',
    position: 'absolute',
    zIndex: -10,
    height: '100%',
    width: '100%',
  },
});
