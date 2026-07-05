// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import type { RowFieldNode } from '@repo/ui/components/Form/Form.types';
import type { FormFieldsState } from '@repo/ui/components/Form/contexts/FormContext/FormContext.types';

import { FormProvider } from '@repo/ui/components/Form/contexts';

import { FormFieldRow } from './FormFieldRow.component';

afterEach(() => {
  cleanup();
});

type Values = { readonly bio: string; readonly name: string };

const renderRow = (field: RowFieldNode<Values>) => {
  const initialFieldsState: FormFieldsState<Values> = {
    errors: {},
    initialValues: { bio: '', name: '' },
    values: { bio: '', name: '' },
  };

  return render(
    <FormProvider<Values> initialFieldsState={initialFieldsState} mode='create'>
      <FormFieldRow<Values> field={field} />
    </FormProvider>,
  );
};

describe('FormFieldRow', () => {
  it('renders every field in the row', () => {
    renderRow({
      fields: [
        { accessor: 'name', label: 'Name', type: 'text' },
        { accessor: 'bio', label: 'Bio', type: 'textarea' },
      ],
      type: 'row',
    });

    expect(screen.getByLabelText('Name', { exact: false })).not.toBeNull();
    expect(screen.getByLabelText('Bio', { exact: false })).not.toBeNull();
  });

  it('renders a single-field row', () => {
    renderRow({
      fields: [{ accessor: 'name', label: 'Name', type: 'text' }],
      type: 'row',
    });

    expect(screen.getByLabelText('Name', { exact: false })).not.toBeNull();
  });
});
