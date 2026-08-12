import * as stylex from '@stylexjs/stylex';

import { colors } from '#ui/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  dottedWrapper: {
    flex: '1 1 auto',
    backgroundImage: `radial-gradient(circle, ${colors.patternDot} 0.1rem, transparent 0%)`,
    backgroundRepeat: 'round',
    backgroundSize: '2rem 2rem',
    containerName: 'app-dotted',
    containerType: 'inline-size',
    display: 'flex',
    flexDirection: 'column',
    maskImage: 'linear-gradient(to bottom, #000000, #000000)',
    scrollbarColor: `${colors.borderSecondary} transparent`,
    scrollbarWidth: 'thin',
    minHeight: 0,
    overflowY: 'auto',
  },
});
