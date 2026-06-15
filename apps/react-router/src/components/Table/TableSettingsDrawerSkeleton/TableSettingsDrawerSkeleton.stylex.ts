import * as stylex from '@stylexjs/stylex';

import { skeleton } from '@/design-system/tokens/commons.stylex';
import { borderRadius, spacing } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';

const baseStyles = stylex.create({
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
    padding: spacing.md,
  },
  buttonBar: {
    height: `calc(2.25rem - ${spacing.xxs} * 2)`,
  },
  circle: {
    borderRadius: '9999px',
    flexShrink: 0,
    height: '1.75rem',
    width: '1.75rem',
  },
  footer: {
    display: 'grid',
    gap: spacing.sm,
    gridTemplateColumns: '1fr 1fr',
    width: '100%',
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
  },
  headerActions: {
    display: 'flex',
    gap: spacing.sm,
  },
  line: {
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  row: {
    alignItems: 'center',
    display: 'grid',
    gap: spacing.sm,
    gridTemplateColumns: '1fr 5rem 4rem',
  },
  rowCell: {
    borderRadius: borderRadius.sm,
    minHeight: '1.75rem',
    overflow: 'hidden',
    position: 'relative',
  },
  rowHeader: {
    borderBottomColor: colors.borderPrimary,
    borderBottomStyle: 'solid',
    borderBottomWidth: '1px',
    display: 'grid',
    gap: spacing.sm,
    gridTemplateColumns: '1fr 4rem 4rem 4rem',
    paddingBottom: spacing.sm,
  },
  rows: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
  },
  sectionTable: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.sm,
  },
  section: {
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.borderPrimary,
    borderRadius: borderRadius.md,
    borderStyle: 'solid',
    borderWidth: '1px',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.md,
    padding: spacing.md,
  },
  tab: {
    height: `calc(1.75rem - ${spacing.xxs} * 2)`,
  },
  tabs: {
    display: 'grid',
    gap: spacing.sm,
    gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
  },
  title: {
    height: `calc(1.25rem - ${spacing.xxs} * 2)`,
  },
});

const widthVariants = stylex.create({
  full: {
    width: '100%',
  },
  medium: {
    width: '55%',
  },
  short: {
    width: '35%',
  },
});

export const styles = {
  body: baseStyles.body,
  buttonBar: baseStyles.buttonBar,
  circle: baseStyles.circle,
  footer: baseStyles.footer,
  group: baseStyles.group,
  headerActions: baseStyles.headerActions,
  line: baseStyles.line,
  row: baseStyles.row,
  rowCell: baseStyles.rowCell,
  rowHeader: baseStyles.rowHeader,
  rows: baseStyles.rows,
  section: baseStyles.section,
  sectionTable: baseStyles.sectionTable,
  tab: baseStyles.tab,
  tabs: baseStyles.tabs,
  title: baseStyles.title,
  widths: widthVariants,
};

export const shimmer = skeleton;
