import { expect, it } from 'vite-plus/test';

import { colors } from '#ui/design-system/tokens/colors.stylex';
import { listStyleTextContrasts } from '#ui/utils/tests/listStyleTextContrasts.util';

import { styles } from './NotificationItem.stylex';

const CASES = await listStyleTextContrasts({
  backgrounds: [colors.surfacePrimary],
  path: 'components/NotificationCenter/NotificationItem/NotificationItem.stylex.ts',
  sources: import.meta.glob<string>('./NotificationItem.stylex.ts', {
    eager: true,
    import: 'default',
    query: '?raw',
  }),
  styles: {
    dismissButtonError: styles.dismissButtonError,
    dismissButtonInfo: styles.dismissButtonInfo,
    dismissButtonSuccess: styles.dismissButtonSuccess,
    dismissButtonWarning: styles.dismissButtonWarning,
  },
});

it.each(CASES)(
  '$theme $name ($foreground) meets WCAG AA on $background',
  ({ ratio }) => {
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  },
);
