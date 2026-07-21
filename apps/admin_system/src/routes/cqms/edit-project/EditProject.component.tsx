import type { FieldNode } from '@lcabrera/ui/components/Form';

import { Form } from '@lcabrera/ui/components/Form';
import { SectionCard } from '@lcabrera/ui/components/SectionCard';
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
          name: project.name,
        }}
        mode='edit'
        serverErrors={serverErrors}
      />
    </SectionCard>
  );
};
