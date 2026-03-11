import * as stylex from '@stylexjs/stylex';

import { spacing } from '@/design-system/tokens/base.stylex';
import { drawerSectionStyles } from '@/design-system/tokens/drawerSection.stylex';

const localStyles = stylex.create({
  container: {
    gap: spacing.lg,
    display: 'flex',
    flexDirection: 'column',
  },
});

export const styles = {
  buttonGroup: drawerSectionStyles.list,
  container: localStyles.container,
};
