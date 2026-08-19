import * as stylex from '@stylexjs/stylex';

import { colors } from '#ui/design-system/tokens/colors.stylex';
import { typography } from '#ui/design-system/tokens/base.stylex';

const local = stylex.create({
  /**
   * Sized against the list row it sits in rather than against the drawer's form
   * controls: it qualifies an item in place, so matching the field styling
   * would read as a second control rather than as part of the key.
   */
  periodSelect: {
    backgroundColor: colors.backgroundPrimary,
    borderColor: colors.borderPrimary,
    borderRadius: '4px',
    borderStyle: 'solid',
    borderWidth: '1px',
    color: colors.textPrimary,
    fontSize: typography.fontSizeXs,
    paddingBlock: '2px',
    paddingInline: '4px',
  },
});

export const styles = {
  periodSelect: local.periodSelect,
};
