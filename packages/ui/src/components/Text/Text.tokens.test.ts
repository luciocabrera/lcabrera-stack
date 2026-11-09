import { describeStyleTextContrasts } from '#ui/utils/tests/describeStyleTextContrasts.util';
import { PAGE_BACKGROUNDS } from '#ui/utils/tests/tests.constants';

import { styles } from './Text.stylex';

await describeStyleTextContrasts({
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
  title: 'the Text status tones',
});
