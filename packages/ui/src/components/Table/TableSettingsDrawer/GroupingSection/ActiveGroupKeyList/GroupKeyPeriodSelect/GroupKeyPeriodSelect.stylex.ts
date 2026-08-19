import * as stylex from '@stylexjs/stylex';

import { typography } from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

const local = stylex.create({
  /**
   * Sized against the list row it sits in rather than against the drawer's form
   * controls: it qualifies an item in place, so matching the field styling
   * would read as a second control rather than as part of the key.
   */
  periodSelect: {
    borderColor: colors.borderPrimary,
    borderRadius: '4px',
    borderStyle: 'solid',
    borderWidth: '1px',
    paddingBlock: '2px',
    paddingInline: '4px',
    backgroundColor: colors.backgroundPrimary,
    color: colors.textPrimary,
    fontSize: typography.fontSizeXs,
  },
});

export const styles = {
  periodSelect: local.periodSelect,
};
