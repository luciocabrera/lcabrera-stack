import { describe, expect, it } from 'vite-plus/test';

import { compileStylexRules } from '#ui/utils/tests/compileStylexRules.util';
import { listStyleTextContrasts } from '#ui/utils/tests/listStyleTextContrasts.util';

import { styles } from './InfoBox.stylex';

const SOURCES = import.meta.glob<string>('./InfoBox.stylex.ts', {
  eager: true,
  import: 'default',
  query: '?raw',
});

const rules = await compileStylexRules([
  {
    path: 'components/InfoBox/InfoBox.stylex.ts',
    source: SOURCES['./InfoBox.stylex.ts'] ?? '',
  },
]);

const CONTRASTS = listStyleTextContrasts({ rules, styles: styles.tone });

describe('the InfoBox tones', () => {
  it.each(CONTRASTS)(
    '$theme $name text meets WCAG AA on $background',
    ({ ratio }) => {
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    },
  );
});
