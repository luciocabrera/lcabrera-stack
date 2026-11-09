import { expect, it } from 'vite-plus/test';

import { colors } from '#ui/design-system/tokens/colors.stylex';
import { listStyleTextContrasts } from '#ui/utils/tests/listStyleTextContrasts.util';
import { STYLE_TEXT_CONTRAST_TITLE } from '#ui/utils/tests/tests.constants';

import { styles } from './NotificationItem.stylex';

const CASES = await listStyleTextContrasts({
  backgrounds: [colors.surfacePrimary],
  sources: import.meta.glob(
    '/src/components/NotificationCenter/NotificationItem/NotificationItem.stylex.ts',
    { query: '?raw' },
  ),
  styles: {
    dismissButtonError: styles.dismissButtonError,
    dismissButtonInfo: styles.dismissButtonInfo,
    dismissButtonSuccess: styles.dismissButtonSuccess,
    dismissButtonWarning: styles.dismissButtonWarning,
  },
});

it.each(CASES)(STYLE_TEXT_CONTRAST_TITLE, ({ ratio }) => {
  expect(ratio).toBeGreaterThanOrEqual(4.5);
});
