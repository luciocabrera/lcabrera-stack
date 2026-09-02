import * as stylex from '@stylexjs/stylex';

import { spacing } from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  header: {
    alignItems: 'stretch',
    display: 'flex',
    minWidth: 0,
    width: '100%',
  },
  tabList: {
    margin: 0,
    padding: 0,
    gap: spacing.xs,
    listStyle: 'none',
    display: 'flex',
    borderBottomColor: colors.borderPrimary,
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
    minWidth: '100%',
    width: 'max-content',
  },
  viewport: {
    flexBasis: 0,
    flexGrow: 1,
    flexShrink: 1,
    scrollBehavior: 'smooth',
    scrollbarWidth: 'none',
    minWidth: 0,
    overflowX: 'auto',
    overflowY: 'hidden',
  },
});
