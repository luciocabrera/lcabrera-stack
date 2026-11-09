import { describe, expect, it } from 'vite-plus/test';

import { compileStylexRules } from '#ui/utils/tests/compileStylexRules.util';
import { listStyleTextContrasts } from '#ui/utils/tests/listStyleTextContrasts.util';

import { styles } from './DetailsSection.stylex';

const SOURCES = import.meta.glob<string>('./DetailsSection.stylex.ts', {
  eager: true,
  import: 'default',
  query: '?raw',
});

const rules = await compileStylexRules([
  {
    path: 'components/Table/ColumnSettingsDrawer/DetailsSection/DetailsSection.stylex.ts',
    source: SOURCES['./DetailsSection.stylex.ts'] ?? '',
  },
]);

const CONTRASTS = listStyleTextContrasts({
  rules,
  styles: {
    badgeNo: styles.badgeNo,
    badgeNone: styles.badgeNone,
    badgeYes: styles.badgeYes,
  },
});

describe('the DetailsSection badges', () => {
  it.each(CONTRASTS)(
    '$theme $name text meets WCAG AA on $background',
    ({ ratio }) => {
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    },
  );
});
