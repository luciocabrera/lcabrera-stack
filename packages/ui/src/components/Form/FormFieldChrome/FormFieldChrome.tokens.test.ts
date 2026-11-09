import { describe, expect, it } from 'vite-plus/test';

import { colors } from '#ui/design-system/tokens/colors.stylex';
import { compileStylexRules } from '#ui/utils/tests/compileStylexRules.util';
import { listStyleTextContrasts } from '#ui/utils/tests/listStyleTextContrasts.util';

import { styles } from './FormFieldChrome.stylex';

const SOURCES = import.meta.glob<string>('./FormFieldChrome.stylex.ts', {
  eager: true,
  import: 'default',
  query: '?raw',
});

const rules = await compileStylexRules([
  {
    path: 'components/Form/FormFieldChrome/FormFieldChrome.stylex.ts',
    source: SOURCES['./FormFieldChrome.stylex.ts'] ?? '',
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
  styles: { error: styles.error, required: styles.required },
});

describe('the FormFieldChrome error text', () => {
  it.each(CONTRASTS)(
    '$theme $name text meets WCAG AA on $background',
    ({ ratio }) => {
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    },
  );
});
