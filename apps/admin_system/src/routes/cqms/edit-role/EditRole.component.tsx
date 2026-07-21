import { SectionCard } from '@lcabrera/ui/components/SectionCard';
import { Suspense } from 'react';
import { useActionData, useLoaderData } from 'react-router';

import type { action } from './editRole.action';
import type { loader } from './editRole.loader';

import { EditRoleForm } from './EditRoleForm/EditRoleForm.component';

export const EditRole = () => {
  const { permissionsPromise, role } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const serverErrors =
    actionData && 'errors' in actionData ? actionData.errors : undefined;

  return (
    <SectionCard
      description='The role name is immutable; the seeded admin role cannot be edited at all.'
      title={`Edit Role: ${role.role_name}`}
    >
      <Suspense fallback={<p>Loading permissions…</p>}>
        <EditRoleForm
          permissionsPromise={permissionsPromise}
          role={role}
          serverErrors={serverErrors}
        />
      </Suspense>
    </SectionCard>
  );
};
