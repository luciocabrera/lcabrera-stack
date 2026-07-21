import { SectionCard } from '@lcabrera/ui/components/SectionCard';
import { Suspense } from 'react';
import { useActionData, useLoaderData } from 'react-router';

import type { action } from './newUser.action';
import type { loader } from './newUser.loader';

import { NewUserForm } from './NewUserForm/NewUserForm.component';

export const NewUser = () => {
  const { rolesPromise } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const serverErrors =
    actionData && 'errors' in actionData ? actionData.errors : undefined;

  return (
    <SectionCard
      description='Create a user account and assign its roles. Passwords are hashed server-side (scrypt); users can change their own later.'
      title='New User'
    >
      <Suspense fallback={<p>Loading roles…</p>}>
        <NewUserForm rolesPromise={rolesPromise} serverErrors={serverErrors} />
      </Suspense>
    </SectionCard>
  );
};
