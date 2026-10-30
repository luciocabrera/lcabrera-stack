import * as stylex from '@stylexjs/stylex';

import { tableDensityVars } from '#ui/components/Table/TableBase/tableDensity.stylex';
import { spacing } from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

export const styles = stylex.create({
  cell: {
    paddingBlock: spacing.xs,
    paddingInline: tableDensityVars.bodyPaddingInline,
    color: colors.textSecondary,
    fontSize: tableDensityVars.bodyFontSize,
    textAlign: 'left',
    borderTopColor: colors.borderPrimary,
    borderTopStyle: 'solid',
    borderTopWidth: '1px',
  },
  footer: {
    backgroundColor: colors.surfaceSecondary,
    display: 'table-footer-group',
  },
  row: {
    display: 'table-row',
  },
});
