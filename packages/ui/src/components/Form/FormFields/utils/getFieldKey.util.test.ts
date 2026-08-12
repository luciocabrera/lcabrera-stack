import { describe, expect, it } from 'vite-plus/test';

import type { FieldNode } from '#ui/components/Form/Form.types';

import { getFieldKey } from './getFieldKey.util';

type Values = {
  readonly email: string;
  readonly name: string;
};

describe('getFieldKey', () => {
  it('prefixes a leaf key with its type', () => {
    const node: FieldNode<Values> = {
      accessor: 'name',
      label: 'Name',
      type: 'text',
    };

    expect(getFieldKey(node)).toBe('text:name');
  });

  it('joins descendant accessors for container nodes', () => {
    const node: FieldNode<Values> = {
      fields: [
        { accessor: 'name', label: 'Name', type: 'text' },
        { accessor: 'email', label: 'Email', type: 'email' },
      ],
      type: 'row',
    };

    expect(getFieldKey(node)).toBe('row:name|email');
  });

  it('produces distinct keys for containers with different contents', () => {
    const first: FieldNode<Values> = {
      fields: [{ accessor: 'name', label: 'Name', type: 'text' }],
      type: 'group',
    };
    const second: FieldNode<Values> = {
      fields: [{ accessor: 'email', label: 'Email', type: 'email' }],
      type: 'group',
    };

    expect(getFieldKey(first)).not.toBe(getFieldKey(second));
  });
});
