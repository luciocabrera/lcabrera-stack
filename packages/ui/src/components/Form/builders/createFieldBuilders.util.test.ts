import type { FieldNode } from '@repo/ui/components/Form/Form.types';

import { describe, expect, it } from 'vitest';

import { createFieldBuilders } from './createFieldBuilders.util';

type TestValues = {
  readonly active: boolean;
  readonly count: number;
  readonly kind: string;
  readonly title: string;
};

describe('createFieldBuilders', () => {
  const { choiceField, field, fieldGroup, fieldRow, toggleField } =
    createFieldBuilders<TestValues>();

  it('builds leaf nodes with the value type bound', () => {
    expect(
      field({
        accessor: 'title',
        label: 'Title',
        required: true,
        type: 'text',
      }),
    ).toStrictEqual({
      accessor: 'title',
      clientValidation: { required: true },
      label: 'Title',
      type: 'text',
    });

    expect(
      choiceField({
        accessor: 'kind',
        label: 'Kind',
        options: [{ label: 'A', value: 'A' }],
        type: 'select',
      }),
    ).toStrictEqual({
      accessor: 'kind',
      label: 'Kind',
      options: [{ label: 'A', value: 'A' }],
      type: 'select',
    });

    expect(toggleField({ accessor: 'active', label: 'Active' })).toStrictEqual({
      accessor: 'active',
      label: 'Active',
      type: 'boolean',
      variant: 'toggle',
    });
  });

  it('composes leaves into a typed FieldNode tree', () => {
    const tree: readonly FieldNode<TestValues>[] = [
      fieldGroup({
        fields: [
          fieldRow({
            fields: [
              field({
                accessor: 'count',
                label: 'Count',
                min: 0,
                type: 'number',
              }),
            ],
            spans: [1],
          }),
        ],
        label: 'Group',
      }),
    ];

    expect(tree).toStrictEqual([
      {
        fields: [
          {
            fields: [
              {
                accessor: 'count',
                clientValidation: { min: 0 },
                label: 'Count',
                type: 'number',
              },
            ],
            spans: [1],
            type: 'row',
          },
        ],
        label: 'Group',
        type: 'group',
      },
    ]);
  });
});
