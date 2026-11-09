import { expect, it } from 'vite-plus/test';

import { listStyleTextContrasts } from '#ui/utils/tests/listStyleTextContrasts.util';

import { styles } from './InfoBox.stylex';

const CASES = await listStyleTextContrasts({
  path: 'components/InfoBox/InfoBox.stylex.ts',
  sources: import.meta.glob<string>('./InfoBox.stylex.ts', {
    eager: true,
    import: 'default',
    query: '?raw',
  }),
  styles: styles.tone,
});

it.each(CASES)(
  '$theme $name ($foreground) meets WCAG AA on $background',
  ({ ratio }) => {
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  },
);
