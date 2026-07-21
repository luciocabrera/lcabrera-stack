import type { FieldNode } from '@lcabrera/ui';

import { Form, SectionCard } from '@lcabrera/ui';
import { useActionData } from 'react-router';

import type { action } from './login.action';
import type { LoginValues } from './login.schema';

const FIELDS: readonly FieldNode<LoginValues>[] = [
  {
    accessor: 'username',
    clientValidation: { required: true },
    label: 'Username',
    type: 'text',
  },
  {
    accessor: 'password',
    clientValidation: { required: true },
    label: 'Password',
    type: 'password',
  },
];

export const Login = () => {
  const actionData = useActionData<typeof action>();
  const serverErrors =
    actionData && 'errors' in actionData ? actionData.errors : undefined;

  return (
    <SectionCard
      description='Sign in with your CQMS account to continue.'
      title='Sign In'
    >
      <Form<LoginValues>
        cancelTo='/'
        fields={FIELDS}
        mode='create'
        serverErrors={serverErrors}
        submitLabel='Sign In'
      />
    </SectionCard>
  );
};
