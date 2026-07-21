import type { LeafFieldDef } from '@lcabrera/ui/components/Form/Form.types';

import { describe, expect, it } from 'vitest';

import { getInitialFormMetaState } from './getInitialFormMetaState.util';

type Values = {
  readonly name: string;
};

const fields: readonly LeafFieldDef<Values>[] = [
  { accessor: 'name', label: 'Name', type: 'text' },
];

describe('getInitialFormMetaState', () => {
  it('resolves label and submission defaults', () => {
    const state = getInitialFormMetaState<Values>({
      cancelTo: '/users',
      fields,
      formId: ':r1:',
      leafFields: fields,
      mode: 'create',
    });

    expect(state).toEqual({
      cancelLabel: 'Cancel',
      cancelTo: '/users',
      fields,
      formId: ':r1:',
      leafFields: fields,
      mode: 'create',
      submission: 'navigation',
      submitLabel: 'Accept',
    });
  });

  it('keeps explicitly provided config over the defaults', () => {
    const state = getInitialFormMetaState<Values>({
      cancelLabel: 'Back',
      cancelTo: '/users',
      fields,
      formId: ':r1:',
      leafFields: fields,
      mode: 'edit',
      submission: 'fetcher',
      submitLabel: 'Save',
    });

    expect(state.cancelLabel).toBe('Back');
    expect(state.submission).toBe('fetcher');
    expect(state.submitLabel).toBe('Save');
  });
});
