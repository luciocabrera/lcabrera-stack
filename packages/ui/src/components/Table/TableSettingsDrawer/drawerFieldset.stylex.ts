import * as stylex from '@stylexjs/stylex';

import { drawerSectionStyles } from '#ui/design-system/tokens/drawerSection.stylex';

const local = stylex.create({
  fieldsetReset: {
    margin: 0,
    padding: 0,
    borderStyle: 'none',
    borderWidth: 0,
    minInlineSize: 0,
  },
});

export const drawerFieldsetStyles = {
  container: drawerSectionStyles.subsection,
  fieldsetReset: local.fieldsetReset,
};
