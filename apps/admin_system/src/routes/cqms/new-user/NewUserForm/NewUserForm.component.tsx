import type { FieldNode } from '@repo/ui/components/Form';

import { Form } from '@repo/ui/components/Form';
import { use } from 'react';

import type { NewUserValues } from '../newUser.schema';
import type { NewUserFormProps } from './NewUserForm.types';

/**
 * Reads `rolesPromise` via `use()` — must be rendered inside a `<Suspense>`
 * boundary by its parent (the TriggerScanForm contract). The promise comes
 * from the loader, never created here.
 */
export const NewUserForm = ({
  rolesPromise,
  serverErrors,
}: NewUserFormProps) => {
  const roles = use(rolesPromise);

  const fields: readonly FieldNode<NewUserValues>[] = [
    {
      accessor: 'username',
      clientValidation: { required: true },
      description: 'Lowercase login name, e.g. jane.doe.',
      label: 'Username',
      type: 'text',
    },
    {
      accessor: 'displayName',
      clientValidation: { required: true },
      label: 'Display Name',
      type: 'text',
    },
    {
      accessor: 'password',
      clientValidation: { minLength: 8, required: true },
      description: 'At least 8 characters.',
      label: 'Password',
      type: 'password',
    },
    {
      accessor: 'roleIds',
      label: 'Roles',
      mode: 'multi',
      options: roles.map((role) => ({
        label: role.description
          ? `${role.role_name} — ${role.description}`
          : role.role_name,
        value: role.id,
      })),
      type: 'select',
    },
  ];

  return (
    <Form<NewUserValues>
      cancelTo='/cqms/admin/users'
      fields={fields}
      initialValues={{ roleIds: [] }}
      mode='create'
      serverErrors={serverErrors}
    />
  );
};
