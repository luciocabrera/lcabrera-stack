import * as stylex from '@stylexjs/stylex';

import { spacing, typography } from '@/design-system/tokens/base.stylex';
import { colors } from '@/design-system/tokens/colors.stylex';
import { drawerSectionStyles } from '@/design-system/tokens/drawerSection.stylex';

const localStyles = stylex.create({
  container: {
    gap: spacing.lg,
    display: 'flex',
    flexDirection: 'column',
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: typography.fontSizeSm,
    fontWeight: 600,
    letterSpacing: '0.05em',
  },
});

export const styles = {
  buttonGroup: drawerSectionStyles.list,
  container: localStyles.container,
  section: drawerSectionStyles.container,
  sectionTitle: localStyles.sectionTitle,
};
