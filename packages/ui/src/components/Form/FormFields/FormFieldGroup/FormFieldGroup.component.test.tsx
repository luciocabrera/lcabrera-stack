// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import type { GroupFieldNode } from '#ui/components/Form/Form.types';

import { FormProvider } from '#ui/components/Form/contexts';
import { FormFieldsRendererContext } from '#ui/components/Form/FormFields/contexts/FormFieldsRendererContext/FormFieldsRendererContext.context';
import { FormFieldsList } from '#ui/components/Form/FormFields/FormFieldsList/FormFieldsList.component';

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

  it('does not render a toggle button for a non-collapsible group', () => {
    renderGroup({
      fields: [{ accessor: 'name', label: 'Name', type: 'text' }],
      label: 'Personal details',
      type: 'group',
    });

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders an expanded toggle button for a collapsible group', () => {
    renderGroup({
      collapsible: true,
      fields: [{ accessor: 'name', label: 'Name', type: 'text' }],
      label: 'Audit',
      type: 'group',
    });

    const toggle = screen.getByRole('button', { name: 'Audit' });
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByLabelText('Name', { exact: false })).not.toBeNull();
  });

  it('starts collapsed when defaultCollapsed is set but keeps fields mounted', () => {
    renderGroup({
      collapsible: true,
      defaultCollapsed: true,
      fields: [{ accessor: 'name', label: 'Name', type: 'text' }],
      label: 'Audit',
      type: 'group',
    });

    const toggle = screen.getByRole('button', { name: 'Audit' });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    const bodyId = toggle.getAttribute('aria-controls') ?? '';
    expect(document.getElementById(bodyId)?.hidden).toBe(true);
    expect(screen.getByLabelText('Name', { exact: false })).not.toBeNull();
  });

  it('toggles collapse state when the header button is clicked', () => {
    renderGroup({
      collapsible: true,
      fields: [{ accessor: 'name', label: 'Name', type: 'text' }],
      label: 'Audit',
      type: 'group',
    });

    const toggle = screen.getByRole('button', { name: 'Audit' });
    const bodyId = toggle.getAttribute('aria-controls') ?? '';

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(document.getElementById(bodyId)?.hidden).toBe(true);

    fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(document.getElementById(bodyId)?.hidden).toBe(false);
  });
});
