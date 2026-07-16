import { SectionCard } from '@repo/ui/components/SectionCard';
import { Suspense } from 'react';
import { useActionData, useLoaderData } from 'react-router';

import type { action } from './editUser.action';
import type { loader } from './editUser.loader';

import { EditUserForm } from './EditUserForm/EditUserForm.component';

export const EditUser = () => {
  const { rolesPromise, user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const serverErrors =
    actionData && 'errors' in actionData ? actionData.errors : undefined;

  return (
    <SectionCard
      description={`Editing ${user.display_name}. The username is immutable; set a new password only to rotate it.`}
      title={`Edit User: ${user.username}`}
    >
      <Suspense fallback={<p>Loading roles…</p>}>
        <EditUserForm
          rolesPromise={rolesPromise}
          serverErrors={serverErrors}
          user={user}
        />
      </Suspense>
    </SectionCard>
  );
};
