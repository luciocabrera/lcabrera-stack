import { expect, it } from 'vite-plus/test';

import { buildFlagsGroup } from './buildFlagsGroup.util';
import { toOrderFormFields } from './toOrderFormFields.util';

it('wraps tabs in a single tab container', () => {
  const [root, ...rest] = toOrderFormFields([
    { fields: [buildFlagsGroup()], label: 'Flags' },
  ]);

  expect(rest).toHaveLength(0);
  expect(root?.type).toBe('tab');
  expect(root?.type === 'tab' ? root.tabs[0]?.label : undefined).toBe('Flags');
});
