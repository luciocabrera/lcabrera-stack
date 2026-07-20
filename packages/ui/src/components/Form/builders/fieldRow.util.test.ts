import type { FieldNode } from '@repo/ui/components/Form/Form.types';

import { describe, expect, it } from 'vitest';

import { fieldRow } from './fieldRow.util';

type TestValues = { readonly isGift: boolean };

const cell: FieldNode<TestValues> = {
  accessor: 'isGift',
  label: 'Gift',
  type: 'boolean',
};

describe('fieldRow', () => {
  it('builds a row without spans', () => {
    expect(fieldRow<TestValues>({ fields: [cell] })).toStrictEqual({
      fields: [cell],
      type: 'row',
    });
  });

  it('includes spans when provided', () => {
    expect(
      fieldRow<TestValues>({ fields: [cell], spans: [2, 1] }),
    ).toStrictEqual({
      fields: [cell],
      spans: [2, 1],
      type: 'row',
    });
  });
});
