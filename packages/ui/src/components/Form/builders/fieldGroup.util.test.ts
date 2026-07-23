import type { FieldNode } from '@lcabrera/ui/components/Form/Form.types';

import { describe, expect, it } from 'vite-plus/test';

import { fieldGroup } from './fieldGroup.util';

type TestValues = { readonly isGift: boolean };

const cell: FieldNode<TestValues> = {
  accessor: 'isGift',
  label: 'Gift',
  type: 'boolean',
};

describe('fieldGroup', () => {
  it('builds a plain group', () => {
    expect(
      fieldGroup<TestValues>({ fields: [cell], label: 'Flags' }),
    ).toStrictEqual({
      fields: [cell],
      label: 'Flags',
      type: 'group',
    });
  });

  it('includes the collapsible flags when provided', () => {
    expect(
      fieldGroup<TestValues>({
        collapsible: true,
        defaultCollapsed: true,
        fields: [cell],
        label: 'Audit',
      }),
    ).toStrictEqual({
      collapsible: true,
      defaultCollapsed: true,
      fields: [cell],
      label: 'Audit',
      type: 'group',
    });
  });

  it('keeps an explicit collapsible: false', () => {
    expect(
      fieldGroup<TestValues>({
        collapsible: false,
        fields: [cell],
        label: 'Summary',
      }),
    ).toStrictEqual({
      collapsible: false,
      fields: [cell],
      label: 'Summary',
      type: 'group',
    });
  });
});
