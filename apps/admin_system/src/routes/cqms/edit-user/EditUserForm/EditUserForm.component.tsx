import type { FieldNode } from '@repo/ui/components/Form';

import { Form } from '@repo/ui/components/Form';
import { use } from 'react';

import type { EditUserValues } from '../editUser.schema';
import type { EditUserFormProps } from './EditUserForm.types';

/**
 * Reads `rolesPromise` via `use()` — must be rendered inside a `<Suspense>`
 * boundary by its parent (the TriggerScanForm contract).
 */
export const EditUserForm = ({
  rolesPromise,
  serverErrors,
  user,
}: EditUserFormProps) => {
  const roles = use(rolesPromise);

  const fields: readonly FieldNode<EditUserValues>[] = [
    {
      accessor: 'displayName',
      clientValidation: { required: true },
      label: 'Display Name',
      type: 'text',
    },
    {
      accessor: 'isEnabled',
      description:
        'Disabled users cannot log in and fail every permission check.',
      label: 'Enabled',
      type: 'boolean',
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
    {
      accessor: 'newPassword',
      description: 'Leave empty to keep the current password.',
      label: 'New Password',
      type: 'password',
    },
  ];

  return (
    <Form<EditUserValues>
      cancelTo='/cqms/admin/users'
      fields={fields}
      initialValues={{
        displayName: user.display_name,
        isEnabled: user.enabled,
        newPassword: '',
        roleIds: [...user.role_ids],
      }}
      mode='edit'
      serverErrors={serverErrors}
    />
  );
};
