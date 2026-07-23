import type { LeafFieldDef } from '@lcabrera/ui/components/Form/Form.types';

import { describe, expect, it } from 'vite-plus/test';

import { getInitialValues } from './getInitialValues.util';

type Values = {
  readonly accepted: boolean;
  readonly amount: number | undefined;
  readonly name: string;
  readonly tags: string[];
};

const leafFields: readonly LeafFieldDef<Values>[] = [
  { accessor: 'name', label: 'Name', type: 'text' },
  { accessor: 'accepted', label: 'Accepted', type: 'boolean' },
  { accessor: 'amount', label: 'Amount', type: 'number' },
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

  // A number field stores `undefined` when cleared. Seeding `''` here made an
  // untouched-then-cleared field compare unequal to its initial value, leaving
  // the form permanently dirty.
  it('defaults number fields to undefined, matching what a cleared field stores', () => {
    const values = getInitialValues<Values>({ leafFields });

    expect(values.amount).toBeUndefined();
    expect('amount' in values).toBe(true);
  });

  it('keeps a provided number value, including 0', () => {
    const values = getInitialValues<Values>({
      initialValues: { amount: 0 },
      leafFields,
    });

    expect(values.amount).toBe(0);
  });
});
