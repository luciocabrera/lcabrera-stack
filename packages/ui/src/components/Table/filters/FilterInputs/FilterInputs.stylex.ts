import * as stylex from '@stylexjs/stylex';

import { filterBaseStyles } from '@repo/ui/design-system/tokens/filters.stylex';

const localStyles = stylex.create({
  containerFill: {
    flex: '1',
    minHeight: 0,
  },
  contentHidden: {
    visibility: 'hidden',
  },
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
  containerFill: localStyles.containerFill,
  contentHidden: localStyles.contentHidden,
  operatorOverride: localStyles.operatorOverride,
  select: filterBaseStyles.select,
};
