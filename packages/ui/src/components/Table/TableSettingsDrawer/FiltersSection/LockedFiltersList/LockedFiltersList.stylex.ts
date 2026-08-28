import * as stylex from '@stylexjs/stylex';

import {
  borderRadius,
  spacing,
  typography,
} from '#ui/design-system/tokens/base.stylex';
import { colors } from '#ui/design-system/tokens/colors.stylex';

const localStyles = stylex.create({
  container: {
    gap: spacing.xs,
    display: 'flex',
    flexDirection: 'column',
  },
  entry: {
    borderColor: colors.borderPrimary,
    borderRadius: borderRadius.md,
    borderStyle: 'dashed',
    borderWidth: '1px',
    gap: spacing.sm,
    paddingBlock: spacing.xxs,
    paddingInline: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.glassBackgroundColorSecondary,
    display: 'flex',
    minHeight: '34px',
  },
  icon: {
    color: colors.textSecondary,
    display: 'flex',
    flexShrink: 0,
  },
  label: {
    color: colors.textSecondary,
    flexShrink: 0,
    fontSize: typography.fontSizeSm,
    fontWeight: 600,
  },
  list: {
    margin: 0,
    padding: 0,
    gap: spacing.sm,
    display: 'flex',
    flexDirection: 'column',
    listStyleType: 'none',
  },
  operator: {
    color: colors.textSecondary,
    flexShrink: 0,
    fontSize: typography.fontSizeSm,
  },
  value: {
    color: colors.textPrimary,
    flexGrow: 1,
    fontSize: typography.fontSizeSm,
    overflowWrap: 'anywhere',
  },
});

export const styles = {
  container: localStyles.container,
  entry: localStyles.entry,
  icon: localStyles.icon,
  label: localStyles.label,
  list: localStyles.list,
  operator: localStyles.operator,
  value: localStyles.value,
};
