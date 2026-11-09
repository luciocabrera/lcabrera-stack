import { describeStyleTextContrasts } from '#ui/utils/tests/describeStyleTextContrasts.util';

import { styles } from './DetailsSection.stylex';

await describeStyleTextContrasts({
  path: 'components/Table/ColumnSettingsDrawer/DetailsSection/DetailsSection.stylex.ts',
  sources: import.meta.glob<string>('./DetailsSection.stylex.ts', {
    eager: true,
    import: 'default',
    query: '?raw',
  }),
  styles: {
    badgeNo: styles.badgeNo,
    badgeNone: styles.badgeNone,
    badgeYes: styles.badgeYes,
  },
  title: 'the DetailsSection badges',
});
