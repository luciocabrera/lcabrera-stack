import * as stylex from '@stylexjs/stylex';

import { borderRadius, spacing } from '#ui/design-system/tokens/base.stylex';
import { filterBaseStyles } from '#ui/design-system/tokens/filters.stylex';

const localStyles = stylex.create({
  clearButton: {
    position: 'absolute',
    transform: 'translateY(-50%)',
    right: spacing.xs,
    top: '50%',
  },
  searchInputGrouped: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: borderRadius.md,
    borderTopRightRadius: borderRadius.md,
  },
  searchInputTopAttached: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  searchInputWrapperFixed: {
    flexShrink: 0,
  },
  searchInputWithClear: {
    paddingRight: spacing.xl,
  },
});

export const styles = {
  clearButton: localStyles.clearButton,
  searchInput: filterBaseStyles.input,
  searchInputGrouped: localStyles.searchInputGrouped,
  searchInputTopAttached: localStyles.searchInputTopAttached,
  searchInputWithClear: localStyles.searchInputWithClear,
  searchInputWrapper: [
    filterBaseStyles.inputWrapper,
    localStyles.searchInputWrapperFixed,
  ],
};
