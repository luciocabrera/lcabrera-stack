import * as stylex from '@stylexjs/stylex';

import { spacing } from '@/design-system/tokens/base.stylex';
import { filterBaseStyles } from '@/design-system/tokens/filters.stylex';

const localStyles = stylex.create({
  clearButton: {
    position: 'absolute',
    right: spacing.xs,
    top: '50%',
    transform: 'translateY(-50%)',
  },
  searchInputWithClear: {
    paddingRight: spacing.xl,
  },
});

export const styles = {
  clearButton: localStyles.clearButton,
  searchInput: filterBaseStyles.input,
  searchInputWithClear: localStyles.searchInputWithClear,
  searchInputWrapper: filterBaseStyles.inputWrapper,
};
