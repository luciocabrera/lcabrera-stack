import { expect, it } from 'vite-plus/test';

import { listStyleTextContrasts } from '#ui/utils/tests/listStyleTextContrasts.util';
import { STYLE_TEXT_CONTRAST_TITLE } from '#ui/utils/tests/tests.constants';

import { styles } from './StatusBadge.stylex';

const CASES = await listStyleTextContrasts({
  sources: import.meta.glob(
    '/src/components/StatusBadge/StatusBadge.stylex.ts',
    { query: '?raw' },
  ),
  styles: styles.tone,
});

it.each(CASES)(STYLE_TEXT_CONTRAST_TITLE, ({ ratio }) => {
  expect(ratio).toBeGreaterThanOrEqual(4.5);
});
