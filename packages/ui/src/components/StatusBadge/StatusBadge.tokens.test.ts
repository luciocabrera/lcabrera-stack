import { describe, expect, it } from 'vite-plus/test';

import { compileStylexRules } from '#ui/utils/tests/compileStylexRules.util';
import { listStyleTextContrasts } from '#ui/utils/tests/listStyleTextContrasts.util';

import { styles } from './StatusBadge.stylex';

const SOURCES = import.meta.glob<string>('./StatusBadge.stylex.ts', {
  eager: true,
  import: 'default',
  query: '?raw',
});

const rules = await compileStylexRules([
  {
    path: 'components/StatusBadge/StatusBadge.stylex.ts',
    source: SOURCES['./StatusBadge.stylex.ts'] ?? '',
  },
]);

const CONTRASTS = listStyleTextContrasts({ rules, styles: styles.tone });

describe('the StatusBadge tones', () => {
  it.each(CONTRASTS)(
    '$theme $name badge text meets WCAG AA on $background',
    ({ ratio }) => {
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    },
  );
});
