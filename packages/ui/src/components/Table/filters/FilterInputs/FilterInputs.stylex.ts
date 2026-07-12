import { filterBaseStyles } from '@repo/ui/design-system/tokens/filters.stylex';
import * as stylex from '@stylexjs/stylex';

const localStyles = stylex.create({
  containerFill: {
    flex: '1',
    minHeight: 0,
  },
  contentHidden: {
    visibility: 'hidden',
  },
});

export const styles = {
  container: filterBaseStyles.container,
  containerFill: localStyles.containerFill,
  contentHidden: localStyles.contentHidden,
};
