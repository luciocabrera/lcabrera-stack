import type { FieldNode } from '@repo/ui/components/Form';

import { Form } from '@repo/ui/components/Form';
import { use } from 'react';

import type { NewRoleValues } from '../newRole.schema';
import type { NewRoleFormProps } from './NewRoleForm.types';

/**
 * Reads `permissionsPromise` via `use()` — must be rendered inside a
 * `<Suspense>` boundary by its parent (the TriggerScanForm contract).
 */
export const NewRoleForm = ({
  permissionsPromise,
  serverErrors,
}: NewRoleFormProps) => {
  const permissions = use(permissionsPromise);

  const fields: readonly FieldNode<NewRoleValues>[] = [
    {
      accessor: 'roleName',
      clientValidation: { required: true },
      description: 'Lowercase kebab-case natural key, e.g. release-manager.',
      label: 'Role Name',
      type: 'text',
    },
    { accessor: 'description', label: 'Description', type: 'textarea' },
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
    <Form<NewRoleValues>
      cancelTo='/cqms/admin/roles'
      fields={fields}
      initialValues={{ permissionIds: [] }}
      mode='create'
      serverErrors={serverErrors}
    />
  );
};
