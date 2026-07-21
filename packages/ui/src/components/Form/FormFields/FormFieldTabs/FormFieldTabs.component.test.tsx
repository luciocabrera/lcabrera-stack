// @vitest-environment jsdom

import type { TabFieldNode } from '@lcabrera/ui/components/Form/Form.types';

import { FormProvider } from '@lcabrera/ui/components/Form/contexts';
import { FormFieldsRendererContext } from '@lcabrera/ui/components/Form/FormFields/contexts/FormFieldsRendererContext/FormFieldsRendererContext.context';
import { FormFieldsList } from '@lcabrera/ui/components/Form/FormFields/FormFieldsList/FormFieldsList.component';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { FormFieldTabs } from './FormFieldTabs.component';

afterEach(() => {
  cleanup();
});

type Values = { readonly bio: string; readonly name: string };

const renderTabs = (field: TabFieldNode<Values>) => {
  return render(
    <FormProvider<Values> cancelTo='/' fields={[field]} mode='create'>
      <FormFieldsRendererContext
        value={(nested) => <FormFieldsList fields={nested} />}
      >
        <FormFieldTabs<Values> field={field} />
      </FormFieldsRendererContext>
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
