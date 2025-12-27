import * as stylex from '@stylexjs/stylex';

import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  container: (height: number) => ({
    height,
    overflow: 'auto',
    scrollbarColor: `${colors.borderSecondary} transparent`,
    scrollbarWidth: 'thin',
    width: '100%',
  }),
  tableOverrides: {
    display: 'table',
    minWidth: 'max-content',
    overflow: 'visible',
  },
});
