import type { LeafFieldDef } from '@repo/ui/components/Form/Form.types';

import { describe, expect, it } from 'vitest';

import { getInitialFieldsState } from './getInitialFieldsState.util';

type Values = {
  readonly accepted: boolean;
  readonly name: string;
};

const leafFields: readonly LeafFieldDef<Values>[] = [
  { accessor: 'name', label: 'Name', type: 'text' },
  { accessor: 'accepted', label: 'Accepted', type: 'boolean' },
];

describe('getInitialFieldsState', () => {
  it('resolves values from the provided initial values and typed defaults', () => {
    const state = getInitialFieldsState<Values>({
      initialValues: { name: 'Ada' },
      leafFields,
    });

    expect(state.values).toEqual({ accepted: false, name: 'Ada' });
    expect(state.initialValues).toEqual(state.values);
    expect(state.errors).toEqual({});
  });

  it('carries server errors into the first snapshot', () => {
    const state = getInitialFieldsState<Values>({
      leafFields,
      serverErrors: { name: 'Required' },
    });

    expect(state.errors).toEqual({ name: 'Required' });
  });
});
