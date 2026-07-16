// @vitest-environment jsdom

import type { GroupFieldNode } from '@repo/ui/components/Form/Form.types';

import { FormProvider } from '@repo/ui/components/Form/contexts';
import { FormFieldsRendererContext } from '@repo/ui/components/Form/FormFields/contexts/FormFieldsRendererContext/FormFieldsRendererContext.context';
import { FormFieldsList } from '@repo/ui/components/Form/FormFields/FormFieldsList/FormFieldsList.component';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { FormFieldGroup } from './FormFieldGroup.component';

afterEach(() => {
  cleanup();
});

type Values = { readonly bio: string; readonly name: string };

const renderGroup = (field: GroupFieldNode<Values>) => {
  return render(
    <FormProvider<Values> cancelTo='/' fields={[field]} mode='create'>
      <FormFieldsRendererContext
        value={(nested) => <FormFieldsList fields={nested} />}
      >
        <FormFieldGroup<Values> field={field} />
      </FormFieldsRendererContext>
    </FormProvider>,
  );
};

describe('FormFieldGroup', () => {
  it('renders the group label when provided', () => {
    renderGroup({
      fields: [{ accessor: 'name', label: 'Name', type: 'text' }],
      label: 'Personal details',
      type: 'group',
    });

    expect(screen.getByText('Personal details')).not.toBeNull();
  });

  it('omits the label element when no label is provided', () => {
    renderGroup({
      fields: [{ accessor: 'name', label: 'Name', type: 'text' }],
      type: 'group',
    });

    expect(screen.queryByText('Personal details')).toBeNull();
  });

  it('renders every nested field', () => {
    renderGroup({
      fields: [
        { accessor: 'name', label: 'Name', type: 'text' },
        { accessor: 'bio', label: 'Bio', type: 'textarea' },
      ],
      type: 'group',
    });

    expect(screen.getByLabelText('Name', { exact: false })).not.toBeNull();
    expect(screen.getByLabelText('Bio', { exact: false })).not.toBeNull();
  });
});
