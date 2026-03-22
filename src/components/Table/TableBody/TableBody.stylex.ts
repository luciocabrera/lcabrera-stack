import * as stylex from '@stylexjs/stylex';

import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  body: (height: number) => ({
    backgroundColor: colors.surfacePrimary,
    display: 'grid',
    position: 'relative',
    height,
  }),
  row: (height: number) => ({
    position: 'absolute',
    height,
    maxHeight: height,
    minHeight: height,
    width: '100%',
  }),
  rowOffset: (offsetY: number) => ({
    transform: `translateY(${offsetY}px)`,
  }),
});
