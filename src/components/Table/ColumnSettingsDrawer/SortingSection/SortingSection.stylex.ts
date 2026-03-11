import * as stylex from '@stylexjs/stylex';

import { drawerSectionStyles } from '@/design-system/tokens/drawerSection.stylex';

const localStyles = stylex.create({
  container: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    minHeight: 0,
  },
});

export const styles = {
  container: localStyles.container,
  headerRow: drawerSectionStyles.headerRow,
  headerTitle: drawerSectionStyles.headerTitle,
  headerToolbar: drawerSectionStyles.headerToolbar,
  list: drawerSectionStyles.list,
  resetSection: drawerSectionStyles.resetSection,
  section: drawerSectionStyles.container,
};
