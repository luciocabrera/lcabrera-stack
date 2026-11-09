import { colors } from '#ui/design-system/tokens/colors.stylex';
import { describeStyleTextContrasts } from '#ui/utils/tests/describeStyleTextContrasts.util';

import { styles } from './NotificationItem.stylex';

await describeStyleTextContrasts({
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
  title: 'the NotificationItem status dismiss buttons',
});
