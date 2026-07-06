import { filterBaseStyles } from '@repo/ui/design-system/tokens/filters.stylex';
import * as stylex from '@stylexjs/stylex';

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
