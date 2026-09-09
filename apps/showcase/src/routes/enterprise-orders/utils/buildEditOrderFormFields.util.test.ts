import { expect, it } from 'vite-plus/test';

import { buildEditOrderFormFields } from './buildEditOrderFormFields.util';
import { collectOrderFormAccessors } from './collectOrderFormAccessors.util';

it('includes order_number and the audit group', () => {
  const accessors = collectOrderFormAccessors(buildEditOrderFormFields());

  expect(accessors).toContain('order_number');
  expect(accessors).toContain('created_at');
  expect(accessors).toContain('updated_at');
  expect(accessors).toContain('order_id');
  expect(accessors).toContain('last_modified_by');
});

it('includes computed totals', () => {
  const accessors = collectOrderFormAccessors(buildEditOrderFormFields());

  expect(accessors).toContain('subtotal');
  expect(accessors).toContain('total_amount');
});

it('returns a single tab container at the root', () => {
  const [root, ...rest] = buildEditOrderFormFields();

  expect(rest).toHaveLength(0);
  expect(root?.type).toBe('tab');
});
