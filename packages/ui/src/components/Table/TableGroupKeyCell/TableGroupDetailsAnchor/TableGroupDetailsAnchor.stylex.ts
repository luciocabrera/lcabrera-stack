import * as stylex from '@stylexjs/stylex';

import { colors } from '#ui/design-system/tokens/colors.stylex';

export const tableGroupDetailsAnchorStyles = stylex.create({
  /**
   * Styled as a link and is one, but **not** a tab stop — see the component for
   * why. Underlined on hover only: every innermost group row carries one, and a
   * permanently underlined column reads as decoration rather than as an action.
   */
  link: {
    textDecoration: { default: 'none', ':hover': 'underline' },
    color: 'inherit',
    cursor: 'pointer',
    outlineColor: colors.borderFocus,
  },
});
