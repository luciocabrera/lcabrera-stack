import type { FieldNode } from '@repo/ui/components/Form';

import { Form } from '@repo/ui/components/Form';
import { SectionCard } from '@repo/ui/components/SectionCard';
import { useActionData, useLoaderData } from 'react-router';

import type { action } from './editProject.action';
import type { loader } from './editProject.loader';
import type { EditProjectValues } from './editProject.schema';

const FIELDS: readonly FieldNode<EditProjectValues>[] = [
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

export const EditProject = () => {
  const { project } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const serverErrors =
    actionData && 'errors' in actionData ? actionData.errors : undefined;

  return (
    <SectionCard description={`Editing ${project.name}.`} title='Edit Project'>
      <Form<EditProjectValues>
        cancelTo='/cqms/projects'
        fields={FIELDS}
        initialValues={{
          localPath: project.local_path,
          name: project.name,
        }}
        mode='edit'
        serverErrors={serverErrors}
      />
    </SectionCard>
  );
};
