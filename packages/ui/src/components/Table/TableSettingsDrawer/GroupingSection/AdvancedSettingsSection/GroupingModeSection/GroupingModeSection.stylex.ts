import * as stylex from '@stylexjs/stylex';

import { drawerSectionStyles } from '#ui/design-system/tokens/drawerSection.stylex';

const local = stylex.create({
  /**
   * `<fieldset>` is the one element that disables a whole radio group at once,
   * and the only one in this section carrying a user-agent border and padding.
   */
  fieldsetReset: {
    margin: 0,
    padding: 0,
    borderStyle: 'none',
    borderWidth: 0,
    minInlineSize: 0,
  },
});

export const styles = {
  container: drawerSectionStyles.subsection,
  fieldsetReset: local.fieldsetReset,
};
