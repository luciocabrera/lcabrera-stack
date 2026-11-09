import * as stylex from '@stylexjs/stylex';

import { spacing } from '#ui/design-system/tokens/base.stylex';

export const styles = stylex.create({
  container: {
    boxSizing: 'border-box',
    position: 'relative',
    maxWidth: '100%',
    minWidth: 0,
    width: '100%',
  },
  label: {
    display: 'block',
    marginBottom: spacing.xxs,
  },
  containerFill: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },
});
