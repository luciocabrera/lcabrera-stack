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
  {
    accessor: 'localPath',
    browseAction: '/_action/browse-directory',
    clientValidation: { required: true },
    description: 'Absolute path to the project on this machine.',
    label: 'Local Path',
    type: 'path',
  },
];

export const NewProject = () => {
  const actionData = useActionData<typeof action>();
  const serverErrors =
    actionData && 'errors' in actionData ? actionData.errors : undefined;

  return (
    <SectionCard
      description='Register a project by its absolute local path so CQMS can scan it.'
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
