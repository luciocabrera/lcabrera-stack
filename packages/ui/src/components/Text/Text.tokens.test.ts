import { describe, expect, it } from 'vite-plus/test';

import { colors } from '#ui/design-system/tokens/colors.stylex';
import { compileStylexRules } from '#ui/utils/tests/compileStylexRules.util';
import { listStyleTextContrasts } from '#ui/utils/tests/listStyleTextContrasts.util';

import { styles } from './Text.stylex';

const SOURCES = import.meta.glob<string>('./Text.stylex.ts', {
  eager: true,
  import: 'default',
  query: '?raw',
});

const rules = await compileStylexRules([
  {
    path: 'components/Text/Text.stylex.ts',
    source: SOURCES['./Text.stylex.ts'] ?? '',
  },
]);

const PAGE_BACKGROUNDS = [
  colors.backgroundPrimary,
  colors.backgroundSecondary,
  colors.backgroundTertiary,
  colors.surfacePrimary,
  colors.surfaceSecondary,
  colors.surfaceElevated,
];

const CONTRASTS = listStyleTextContrasts({
  backgrounds: PAGE_BACKGROUNDS,
  rules,
  styles: {
    error: styles.tone.error,
    info: styles.tone.info,
    success: styles.tone.success,
    warning: styles.tone.warning,
  },
});

describe('the Text status tones', () => {
  it.each(CONTRASTS)(
    '$theme $name text meets WCAG AA on $background',
    ({ ratio }) => {
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    },
  );
});
