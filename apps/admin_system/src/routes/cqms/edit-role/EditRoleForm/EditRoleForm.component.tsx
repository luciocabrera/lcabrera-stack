import type { FieldNode } from '@lcabrera/ui/components/Form';

import { Form } from '@lcabrera/ui/components/Form';
import { use } from 'react';

import type { EditRoleValues } from '../editRole.schema';
import type { EditRoleFormProps } from './EditRoleForm.types';

/**
 * Reads `permissionsPromise` via `use()` — must be rendered inside a
 * `<Suspense>` boundary by its parent (the TriggerScanForm contract).
 */
export const EditRoleForm = ({
  permissionsPromise,
  role,
  serverErrors,
}: EditRoleFormProps) => {
  const permissions = use(permissionsPromise);

  const fields: readonly FieldNode<EditRoleValues>[] = [
    { accessor: 'description', label: 'Description', type: 'textarea' },
    {
      accessor: 'isEnabled',
      description: 'A disabled role stops granting its permissions.',
      label: 'Enabled',
      type: 'boolean',
    },
    {
      accessor: 'permissionIds',
      description: 'Type-wide allows: action × resource type.',
      label: 'Permissions',
      mode: 'multi',
      options: permissions.map((permission) => ({
        label: `${permission.resource_type}: ${permission.action}`,
        value: permission.id,
      })),
      type: 'select',
    },
  ];

  return (
    <Form<EditRoleValues>
      cancelTo='/cqms/admin/roles'
      fields={fields}
      initialValues={{
        description: role.description ?? '',
        isEnabled: role.enabled,
        permissionIds: [...role.permission_ids],
      }}
      mode='edit'
      serverErrors={serverErrors}
    />
  );
};
