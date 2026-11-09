import { describe, expect, it } from 'vite-plus/test';

import { colors } from '#ui/design-system/tokens/colors.stylex';
import { compileStylexRules } from '#ui/utils/tests/compileStylexRules.util';
import { listStyleTextContrasts } from '#ui/utils/tests/listStyleTextContrasts.util';

import { styles } from './NotificationItem.stylex';

const SOURCES = import.meta.glob<string>('./NotificationItem.stylex.ts', {
  eager: true,
  import: 'default',
  query: '?raw',
});

const rules = await compileStylexRules([
  {
    path: 'components/NotificationCenter/NotificationItem/NotificationItem.stylex.ts',
    source: SOURCES['./NotificationItem.stylex.ts'] ?? '',
  },
]);

const CONTRASTS = listStyleTextContrasts({
  backgrounds: [colors.surfacePrimary],
  rules,
  styles: {
    dismissButtonError: styles.dismissButtonError,
    dismissButtonInfo: styles.dismissButtonInfo,
    dismissButtonSuccess: styles.dismissButtonSuccess,
    dismissButtonWarning: styles.dismissButtonWarning,
  },
});

describe('the NotificationItem status dismiss buttons', () => {
  it.each(CONTRASTS)(
    '$theme $name meets WCAG AA on $background',
    ({ ratio }) => {
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    },
  );
});
