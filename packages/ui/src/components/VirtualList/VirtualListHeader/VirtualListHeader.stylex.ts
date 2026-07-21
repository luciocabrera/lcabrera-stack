import { spacing } from '@lcabrera/ui/design-system/tokens/base.stylex';
import { filterBaseStyles } from '@lcabrera/ui/design-system/tokens/filters.stylex';
import * as stylex from '@stylexjs/stylex';

const localStyles = stylex.create({
  clearButton: {
    position: 'absolute',
    transform: 'translateY(-50%)',
    right: spacing.xs,
    top: '50%',
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
