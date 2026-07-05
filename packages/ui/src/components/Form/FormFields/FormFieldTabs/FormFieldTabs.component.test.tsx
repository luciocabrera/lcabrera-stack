// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import type { TabFieldNode } from '@repo/ui/components/Form/Form.types';
import type { FormFieldsState } from '@repo/ui/components/Form/contexts/FormContext/FormContext.types';

import { FormProvider } from '@repo/ui/components/Form/contexts';

import { FormFieldTabs } from './FormFieldTabs.component';

afterEach(() => {
  cleanup();
});

type Values = { readonly bio: string; readonly name: string };

const renderTabs = (field: TabFieldNode<Values>) => {
  const initialFieldsState: FormFieldsState<Values> = {
    errors: {},
    initialValues: { bio: '', name: '' },
    values: { bio: '', name: '' },
  };

  return render(
    <FormProvider<Values> initialFieldsState={initialFieldsState} mode='create'>
      <FormFieldTabs<Values> field={field} />
    </FormProvider>,
  );
};

const buildField = (): TabFieldNode<Values> => ({
  tabs: [
    {
      fields: [{ accessor: 'name', label: 'Name', type: 'text' }],
      label: 'Profile',
    },
    {
      fields: [{ accessor: 'bio', label: 'Bio', type: 'textarea' }],
      label: 'About',
    },
  ],
  type: 'tab',
});

describe('FormFieldTabs', () => {
  it('renders a tab header for every tab', () => {
    renderTabs(buildField());

    expect(screen.getByRole('tab', { name: 'Profile' })).not.toBeNull();
    expect(screen.getByRole('tab', { name: 'About' })).not.toBeNull();
  });

  it('renders each tab panel content', () => {
    renderTabs(buildField());

    expect(screen.getByLabelText('Name', { exact: false })).not.toBeNull();
    expect(screen.getByLabelText('Bio', { exact: false })).not.toBeNull();
  });
});
