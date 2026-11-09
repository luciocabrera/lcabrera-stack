import { describeStyleTextContrasts } from '#ui/utils/tests/describeStyleTextContrasts.util';

import { styles } from './StatusBadge.stylex';

await describeStyleTextContrasts({
  path: 'components/StatusBadge/StatusBadge.stylex.ts',
  sources: import.meta.glob<string>('./StatusBadge.stylex.ts', {
    eager: true,
    import: 'default',
    query: '?raw',
  }),
  styles: styles.tone,
  title: 'the StatusBadge tones',
});
