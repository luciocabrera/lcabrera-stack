import { expect, it } from 'vite-plus/test';

import { listStyleTextContrasts } from '#ui/utils/tests/listStyleTextContrasts.util';
import { PAGE_BACKGROUNDS } from '#ui/utils/tests/tests.constants';

import { styles } from './Text.stylex';

const CASES = await listStyleTextContrasts({
  backgrounds: PAGE_BACKGROUNDS,
  path: 'components/Text/Text.stylex.ts',
  sources: import.meta.glob<string>('./Text.stylex.ts', {
    eager: true,
    import: 'default',
    query: '?raw',
  }),
  styles: {
    error: styles.tone.error,
    info: styles.tone.info,
    success: styles.tone.success,
    warning: styles.tone.warning,
  },
});

it.each(CASES)(
  '$theme $name ($foreground) meets WCAG AA on $background',
  ({ ratio }) => {
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  },
);
