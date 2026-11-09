import { expect, it } from 'vite-plus/test';

import { listStyleTextContrasts } from '#ui/utils/tests/listStyleTextContrasts.util';
import {
  PAGE_BACKGROUNDS,
  STYLE_TEXT_CONTRAST_TITLE,
} from '#ui/utils/tests/tests.constants';

import { styles } from './Text.stylex';

const CASES = await listStyleTextContrasts({
  backgrounds: PAGE_BACKGROUNDS,
  sources: import.meta.glob('/src/components/Text/Text.stylex.ts', {
    query: '?raw',
  }),
  styles: {
    error: styles.tone.error,
    info: styles.tone.info,
    success: styles.tone.success,
    warning: styles.tone.warning,
  },
});

it.each(CASES)(STYLE_TEXT_CONTRAST_TITLE, ({ ratio }) => {
  expect(ratio).toBeGreaterThanOrEqual(4.5);
});
