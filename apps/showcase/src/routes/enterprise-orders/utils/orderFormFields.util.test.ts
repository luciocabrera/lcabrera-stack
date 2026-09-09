import type { FieldNode } from '@lcabrera/ui/components/Form';

import { expect, it } from 'vite-plus/test';

import type { EnterpriseOrderValues } from '../config';

import {
  buildCreateOrderFormFields,
  buildEditOrderFormFields,
} from './orderFormFields.util';

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

it('create fields omit order_number and the audit group', () => {
  const accessors = collectAccessors(buildCreateOrderFormFields());

  expect(accessors).not.toContain('order_number');
  expect(accessors).not.toContain('created_at');
  expect(accessors).not.toContain('updated_at');
  expect(accessors).not.toContain('order_id');
  expect(accessors).not.toContain('last_modified_by');
});

it('create fields omit computed totals', () => {
  const accessors = collectAccessors(buildCreateOrderFormFields());

  expect(accessors).not.toContain('subtotal');
  expect(accessors).not.toContain('total_amount');
});

it('create fields still expose the required input fields', () => {
  const accessors = collectAccessors(buildCreateOrderFormFields());

  expect(accessors).toContain('customer_name');
  expect(accessors).toContain('quantity');
  expect(accessors).toContain('priority');
});

it('edit fields include order_number and the audit group', () => {
  const accessors = collectAccessors(buildEditOrderFormFields());

  expect(accessors).toContain('order_number');
  expect(accessors).toContain('created_at');
  expect(accessors).toContain('updated_at');
  expect(accessors).toContain('order_id');
  expect(accessors).toContain('last_modified_by');
});

it('edit fields include computed totals', () => {
  const accessors = collectAccessors(buildEditOrderFormFields());

  expect(accessors).toContain('subtotal');
  expect(accessors).toContain('total_amount');
});

it('create builder returns a single tab container at the root', () => {
  const [root, ...rest] = buildCreateOrderFormFields();

  expect(rest).toHaveLength(0);
  expect(root?.type).toBe('tab');
});

it('edit builder returns a single tab container at the root', () => {
  const [root, ...rest] = buildEditOrderFormFields();

  expect(rest).toHaveLength(0);
  expect(root?.type).toBe('tab');
});
