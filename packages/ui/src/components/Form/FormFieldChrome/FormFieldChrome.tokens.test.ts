import { expect, it } from 'vite-plus/test';

import { listStyleTextContrasts } from '#ui/utils/tests/listStyleTextContrasts.util';
import {
  PAGE_BACKGROUNDS,
  STYLE_TEXT_CONTRAST_TITLE,
} from '#ui/utils/tests/tests.constants';

import { styles } from './FormFieldChrome.stylex';

const CASES = await listStyleTextContrasts({
  backgrounds: PAGE_BACKGROUNDS,
  sources: import.meta.glob(
    '/src/components/Form/FormFieldChrome/FormFieldChrome.stylex.ts',
    { query: '?raw' },
  ),
  styles: { error: styles.error, required: styles.required },
});

it.each(CASES)(STYLE_TEXT_CONTRAST_TITLE, ({ ratio }) => {
  expect(ratio).toBeGreaterThanOrEqual(4.5);
});
