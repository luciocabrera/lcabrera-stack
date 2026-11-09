import { describeStyleTextContrasts } from '#ui/utils/tests/describeStyleTextContrasts.util';

import { styles } from './InfoBox.stylex';

await describeStyleTextContrasts({
  path: 'components/InfoBox/InfoBox.stylex.ts',
  sources: import.meta.glob<string>('./InfoBox.stylex.ts', {
    eager: true,
    import: 'default',
    query: '?raw',
  }),
  styles: styles.tone,
  title: 'the InfoBox tones',
});
