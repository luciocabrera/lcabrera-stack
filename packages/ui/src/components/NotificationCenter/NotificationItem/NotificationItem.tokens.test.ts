import { expect, it } from 'vite-plus/test';

import { colors } from '#ui/design-system/tokens/colors.stylex';
import { listStyleTextContrasts } from '#ui/utils/tests/listStyleTextContrasts.util';

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

it.each(CASES)(
  '$theme $name ($foreground) reaches 4.5:1 on the base surface $background, before the status gradient',
  ({ ratio }) => {
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  },
);
