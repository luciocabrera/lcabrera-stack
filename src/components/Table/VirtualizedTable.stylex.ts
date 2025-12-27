import * as stylex from '@stylexjs/stylex';

import { colors } from '@/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  container: (height: number) => ({
    overflow: 'auto',
    scrollbarColor: `${colors.borderSecondary} transparent`,
    scrollbarWidth: 'thin',
    height,
    width: '100%',
  })
});
