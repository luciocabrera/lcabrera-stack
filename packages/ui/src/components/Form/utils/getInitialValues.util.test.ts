import { describe, expect, it } from 'vitest';

import type { LeafFieldDef } from '@repo/ui/components/Form/Form.types';

import { getInitialValues } from './getInitialValues.util';

type Values = {
  readonly accepted: boolean;
  readonly name: string;
  readonly tags: string[];
};

const leafFields: readonly LeafFieldDef<Values>[] = [
  { accessor: 'name', label: 'Name', type: 'text' },
  { accessor: 'accepted', label: 'Accepted', type: 'boolean' },
  {
    accessor: 'tags',
    label: 'Tags',
    mode: 'multi',
    options: [],
    type: 'select',
  },
];

describe('getInitialValues', () => {
  it('uses provided initialValues when present', () => {
    const values = getInitialValues<Values>({
      initialValues: { name: 'Ada' },
      leafFields,
    });

    expect(values.name).toBe('Ada');
  });

  it('defaults boolean fields to false', () => {
    const values = getInitialValues<Values>({ leafFields });

    expect(values.accepted).toBe(false);
  });

  it('defaults multi-select fields to an empty array', () => {
    const values = getInitialValues<Values>({ leafFields });

    expect(values.tags).toEqual([]);
  });

  it('defaults text fields to an empty string', () => {
    const values = getInitialValues<Values>({ leafFields });

    expect(values.name).toBe('');
  });
});
