import type { FieldNode } from '@repo/ui/components/Form';

import { expect, it } from 'vitest';

import type { EnterpriseOrderValues } from './config';

import { buildOrderFormFields } from './orderFormFields.util';

const collectAccessors = (
  nodes: readonly FieldNode<EnterpriseOrderValues>[],
): readonly string[] =>
  nodes.flatMap((node) => {
    if (node.type === 'tab') {
      return node.tabs.flatMap((tab) => collectAccessors(tab.fields));
    }
    if (node.type === 'group' || node.type === 'row') {
      return collectAccessors(node.fields);
    }

    return [node.accessor];
  });

it('exposes the required input fields in create mode', () => {
  const accessors = collectAccessors(buildOrderFormFields({ mode: 'create' }));

  expect(accessors).toContain('customer_name');
  expect(accessors).toContain('quantity');
  expect(accessors).toContain('priority');
});

it('omits server-managed, computed and audit fields in create mode', () => {
  const accessors = collectAccessors(buildOrderFormFields({ mode: 'create' }));

  expect(accessors).not.toContain('order_number');
  expect(accessors).not.toContain('subtotal');
  expect(accessors).not.toContain('total_amount');
  expect(accessors).not.toContain('created_at');
  expect(accessors).not.toContain('order_id');
});

it('includes the read-only computed and audit fields in edit mode', () => {
  const accessors = collectAccessors(buildOrderFormFields({ mode: 'edit' }));

  expect(accessors).toContain('order_number');
  expect(accessors).toContain('subtotal');
  expect(accessors).toContain('total_amount');
  expect(accessors).toContain('created_at');
  expect(accessors).toContain('order_id');
});

it('builds a single tab container at the root', () => {
  const [root, ...rest] = buildOrderFormFields({ mode: 'view' });

  expect(rest).toHaveLength(0);
  expect(root?.type).toBe('tab');
});
