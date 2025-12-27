import * as stylex from '@stylexjs/stylex';

import { spacing } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

export const tableRowStyles = stylex.create({
  base: {
    paddingBlock: 'var(--table-padding-block)',
    paddingInline: 'var(--table-padding-inline)',
    alignItems: 'center',
    columnGap: spacing.sm,
    display: 'flex',
    borderBottomColor: colors.borderSecondary,
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
    minHeight: 0,
    width: '100%',
  },
  header: {
    backgroundColor: colors.surfaceSecondary,
  },
  striped: {
    backgroundColor: colors.backgroundSecondary,
  },
});
