import type { FieldNode } from '@lcabrera/ui';

import { Form, SectionCard } from '@lcabrera/ui';
import { useActionData, useLoaderData } from 'react-router';

import type { action } from './login.action';
import type { loader } from './login.loader';
import type { LoginValues } from './login.schema';

import { EMAIL_PATTERN, PASSWORD_MIN_LENGTH } from './login.schema';

const FIELDS: readonly FieldNode<LoginValues>[] = [
  {
    accessor: 'email',
    clientValidation: { pattern: EMAIL_PATTERN, required: true },
    label: 'Email',
    placeholder: 'you@example.com',
    type: 'email',
  },
  {
    accessor: 'password',
    clientValidation: { minLength: PASSWORD_MIN_LENGTH, required: true },
    label: 'Password',
    type: 'password',
  },
];

export const Login = () => {
  const { redirectTo } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const serverErrors =
    actionData && 'errors' in actionData ? actionData.errors : undefined;

  return (
    <SectionCard
      description='Sign in with the demo account to continue.'
      title='Sign In'
    >
      <Form<LoginValues>
        cancelTo='/'
        fields={FIELDS}
        mode='create'
        serverErrors={serverErrors}
        submitLabel='Sign In'
      >
        <input name='redirectTo' type='hidden' value={redirectTo} />
      </Form>
    </SectionCard>
  );
};
