import * as stylex from '@stylexjs/stylex';

import { filterBaseStyles } from '@/design-system/tokens/filters.stylex';

const localStyles = stylex.create({
  operatorOverride: {
    borderRadius: 0,
    overflow: 'visible',
    backgroundColor: 'transparent',
    boxShadow: 'none',
    position: 'relative',
    left: 'auto',
    right: 'auto',
    top: 'auto',
  },
});

export const styles = {
  container: filterBaseStyles.container,
  operatorOverride: localStyles.operatorOverride,
  select: filterBaseStyles.select,
};
