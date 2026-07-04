import { describe, expect, it } from 'vitest';

import type { FieldNode } from '@repo/ui/components/Form/Form.types';

import { flattenFields } from './flattenFields.util';

type Values = { readonly a: string; readonly b: string; readonly c: string };

describe('flattenFields', () => {
  it('returns leaf fields unchanged when there is no nesting', () => {
    const fields: readonly FieldNode<Values>[] = [
      { accessor: 'a', label: 'A', type: 'text' },
    ];

    expect(flattenFields(fields)).toEqual(fields);
  });

  it('flattens group and row nodes recursively', () => {
    const fields: readonly FieldNode<Values>[] = [
      {
        fields: [
          { accessor: 'a', label: 'A', type: 'text' },
          {
            fields: [
              { accessor: 'b', label: 'B', type: 'text' },
              { accessor: 'c', label: 'C', type: 'text' },
            ],
            type: 'row',
          },
        ],
        type: 'group',
      },
    ];

    expect(flattenFields(fields).map((field) => field.accessor)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('flattens all tabs of a tab node', () => {
    const fields: readonly FieldNode<Values>[] = [
      {
        tabs: [
          {
            fields: [{ accessor: 'a', label: 'A', type: 'text' }],
            label: 'One',
          },
          {
            fields: [
              { accessor: 'b', label: 'B', type: 'text' },
              { accessor: 'c', label: 'C', type: 'text' },
            ],
            label: 'Two',
          },
        ],
        type: 'tab',
      },
    ];

    expect(flattenFields(fields).map((field) => field.accessor)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });
});
