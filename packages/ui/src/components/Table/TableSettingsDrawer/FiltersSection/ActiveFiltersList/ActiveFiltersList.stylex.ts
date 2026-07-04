import * as stylex from '@stylexjs/stylex';

import { spacing } from '@repo/ui/design-system/tokens/base.stylex';
import { drawerSectionStyles } from '@repo/ui/design-system/tokens/drawerSection.stylex';

const localStyles = stylex.create({
  container: {
    flex: '1',
    gap: spacing.md,
    display: 'flex',
    flexDirection: 'column',
  },
});

export const styles = {
  container: localStyles.container,
  filtersList: drawerSectionStyles.list,
};
