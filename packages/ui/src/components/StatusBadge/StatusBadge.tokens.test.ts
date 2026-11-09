import { expect, it } from 'vite-plus/test';

import { listStyleTextContrasts } from '#ui/utils/tests/listStyleTextContrasts.util';

import { styles } from './StatusBadge.stylex';

const CASES = await listStyleTextContrasts({
  path: 'components/StatusBadge/StatusBadge.stylex.ts',
  sources: import.meta.glob<string>('./StatusBadge.stylex.ts', {
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
