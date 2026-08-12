import * as stylex from '@stylexjs/stylex';

import { filterBaseStyles } from '#ui/design-system/tokens/filters.stylex';

const localStyles = stylex.create({
  input: {
    flex: '1',
  },
});

export const styles = {
  container: filterBaseStyles.container,
  input: [filterBaseStyles.input, localStyles.input],
  inputGroup: filterBaseStyles.inputGroup,
  separator: filterBaseStyles.separator,
};
