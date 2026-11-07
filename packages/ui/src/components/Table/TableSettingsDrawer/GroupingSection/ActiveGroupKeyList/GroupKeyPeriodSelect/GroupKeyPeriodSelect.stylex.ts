import * as stylex from '@stylexjs/stylex';

import { typography } from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

const local = stylex.create({
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
    height: 'auto',
    width: 'auto',
  },
});

export const styles = {
  periodSelect: local.periodSelect,
};
