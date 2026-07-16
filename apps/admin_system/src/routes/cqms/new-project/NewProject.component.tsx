import type { FieldNode } from '@repo/ui/components/Form';

import { Form } from '@repo/ui/components/Form';
import { SectionCard } from '@repo/ui/components/SectionCard';
import { useActionData } from 'react-router';

import type { action } from './newProject.action';
import type { NewProjectValues } from './newProject.schema';

const FIELDS: readonly FieldNode<NewProjectValues>[] = [
  {
    accessor: 'name',
    clientValidation: { required: true },
    label: 'Project Name',
    type: 'text',
  },
];

export const NewProject = () => {
  const actionData = useActionData<typeof action>();
  const serverErrors =
    actionData && 'errors' in actionData ? actionData.errors : undefined;

  return (
    <SectionCard
      description='Register a project, then upload a code snapshot from its page to enable scans.'
      title='New Project'
    >
      <Form<NewProjectValues>
        cancelTo='/cqms/projects'
        fields={FIELDS}
        mode='create'
        serverErrors={serverErrors}
      />
    </SectionCard>
  );
};
