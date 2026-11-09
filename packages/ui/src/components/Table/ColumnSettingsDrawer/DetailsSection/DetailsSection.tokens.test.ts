import { expect, it } from 'vite-plus/test';

import { listStyleTextContrasts } from '#ui/utils/tests/listStyleTextContrasts.util';

import { styles } from './DetailsSection.stylex';

const CASES = await listStyleTextContrasts({
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
});

it.each(CASES)(
  '$theme $name ($foreground) meets WCAG AA on $background',
  ({ ratio }) => {
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  },
);
