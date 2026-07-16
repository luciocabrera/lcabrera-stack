import { SectionCard } from '@repo/ui/components/SectionCard';
import { Suspense } from 'react';
import { useActionData, useLoaderData } from 'react-router';

import type { action } from './newRole.action';
import type { loader } from './newRole.loader';

import { NewRoleForm } from './NewRoleForm/NewRoleForm.component';

export const NewRole = () => {
  const { permissionsPromise } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const serverErrors =
    actionData && 'errors' in actionData ? actionData.errors : undefined;

  return (
    <SectionCard
      description='Create a role and pick its type-wide permissions. Per-instance grants live on each project page.'
      title='New Role'
    >
      <Suspense fallback={<p>Loading permissions…</p>}>
        <NewRoleForm
          permissionsPromise={permissionsPromise}
          serverErrors={serverErrors}
        />
      </Suspense>
    </SectionCard>
  );
};
