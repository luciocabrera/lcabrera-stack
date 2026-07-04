// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRoutesStub } from 'react-router';

import type { FieldNode, FormMode } from './Form.types';

import { Form } from './Form.component';

afterEach(() => {
  cleanup();
});

type Values = {
  readonly accepted: boolean;
  readonly bio: string;
  readonly name: string;
  readonly role: string;
};

const buildFields = (): readonly FieldNode<Values>[] => [
  {
    fields: [
      {
        accessor: 'name',
        clientValidation: { required: true },
        label: 'Name',
        type: 'text',
      },
      { accessor: 'bio', label: 'Bio', type: 'textarea' },
    ],
    type: 'row',
  },
  {
    accessor: 'accepted',
    label: 'Accept terms',
    type: 'boolean',
  },
  {
    tabs: [
      {
        fields: [
          {
            accessor: 'role',
            label: 'Role',
            options: [
              { label: 'Admin', value: 'admin' },
              { label: 'Member', value: 'member' },
            ],
            type: 'radio',
          },
        ],
        label: 'Details',
      },
    ],
    type: 'tab',
  },
];

const renderForm = ({
  action,
  fields = buildFields(),
  initialValues,
  mode,
}: {
  readonly action: (args: { readonly request: Request }) => unknown;
  readonly fields?: readonly FieldNode<Values>[];
  readonly initialValues?: Partial<Values>;
  readonly mode: FormMode;
}) => {
  const Stub = createRoutesStub([
    {
      Component: () => (
        <Form<Values>
          fields={fields}
          initialValues={initialValues}
          mode={mode}
          submitLabel='Save'
        />
      ),
      action,
      path: '/',
    },
  ]);

  return render(<Stub initialEntries={['/']} />);
};

describe('Form', () => {
  it('dispatches every leaf type through the registry and submits real FormData', async () => {
    let submittedFormData: FormData | undefined;
    const action = vi.fn(async ({ request }: { request: Request }) => {
      submittedFormData = await request.formData();
      return null;
    });

    renderForm({ action, mode: 'create' });

    fireEvent.change(screen.getByLabelText('Name', { exact: false }), {
      target: { value: 'Ada' },
    });
    fireEvent.change(screen.getByLabelText('Bio'), {
      target: { value: 'Mathematician' },
    });
    fireEvent.click(screen.getByLabelText('Accept terms'));
    fireEvent.click(screen.getByLabelText('Admin'));

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect(submittedFormData?.get('name')).toBe('Ada');
    expect(submittedFormData?.get('bio')).toBe('Mathematician');
    expect(submittedFormData?.get('accepted')).toBe('on');
    expect(submittedFormData?.get('role')).toBe('admin');
  });

  it('blocks submission and shows an inline error when a required field is empty', async () => {
    const action = vi.fn(async () => null);

    renderForm({ action, mode: 'create' });

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toBe('Name is required.');
    expect(action).not.toHaveBeenCalled();
  });

  it('disables all fields and hides the footer in view mode', () => {
    renderForm({
      action: vi.fn(),
      initialValues: { name: 'Ada' },
      mode: 'view',
    });

    const nameInput = screen.getByLabelText('Name', {
      exact: false,
    }) as HTMLInputElement;
    expect(nameInput.disabled).toBe(true);
    expect(screen.queryByRole('button', { name: 'Save' })).toBeNull();
  });

  it('keeps the submit button disabled in edit mode until a value actually changes', async () => {
    const action = vi.fn(async ({ request }: { request: Request }) => {
      await request.formData();
      return null;
    });

    renderForm({ action, initialValues: { name: 'Ada' }, mode: 'edit' });

    const submitButton = screen.getByRole<HTMLButtonElement>('button', {
      name: 'Save',
    });
    expect(submitButton.disabled).toBe(true);

    fireEvent.change(screen.getByLabelText('Name', { exact: false }), {
      target: { value: 'Grace' },
    });

    await waitFor(() => expect(submitButton.disabled).toBe(false));

    fireEvent.click(submitButton);
    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
  });
});
