import type { FieldNode } from '@repo/ui/components/Form/Form.types';

import { describe, expect, it } from 'vitest';

import { collectAccessors } from './collectAccessors.util';

type Values = {
  readonly age: number;
  readonly city: string;
  readonly email: string;
  readonly name: string;
};

describe('collectAccessors', () => {
  it('returns the accessor for a leaf field', () => {
    const node: FieldNode<Values> = {
      accessor: 'name',
      label: 'Name',
      type: 'text',
    };

    expect(collectAccessors(node)).toEqual(['name']);
  });

  it('collects accessors from a group in declaration order', () => {
    const node: FieldNode<Values> = {
      fields: [
        { accessor: 'name', label: 'Name', type: 'text' },
        { accessor: 'email', label: 'Email', type: 'email' },
      ],
      type: 'group',
    };

    expect(collectAccessors(node)).toEqual(['name', 'email']);
  });

  it('collects accessors from a row', () => {
    const node: FieldNode<Values> = {
      fields: [
        { accessor: 'city', label: 'City', type: 'text' },
        { accessor: 'age', label: 'Age', type: 'number' },
      ],
      type: 'row',
    };

    expect(collectAccessors(node)).toEqual(['city', 'age']);
  });

  it('collects accessors across every tab', () => {
    const node: FieldNode<Values> = {
      tabs: [
        {
          fields: [{ accessor: 'name', label: 'Name', type: 'text' }],
          label: 'Profile',
        },
        {
          fields: [{ accessor: 'email', label: 'Email', type: 'email' }],
          label: 'Contact',
        },
      ],
      type: 'tab',
    };

    expect(collectAccessors(node)).toEqual(['name', 'email']);
  });

  it('recurses through nested containers', () => {
    const node: FieldNode<Values> = {
      fields: [
        {
          fields: [
            { accessor: 'name', label: 'Name', type: 'text' },
            { accessor: 'email', label: 'Email', type: 'email' },
          ],
          type: 'row',
        },
        { accessor: 'age', label: 'Age', type: 'number' },
      ],
      type: 'group',
    };

    expect(collectAccessors(node)).toEqual(['name', 'email', 'age']);
  });
});
