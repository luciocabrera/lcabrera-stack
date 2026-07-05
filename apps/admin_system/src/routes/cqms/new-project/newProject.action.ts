import { registerProject } from '@repo/scan-ingestion/queries/registerProject.util';
import { type ActionFunctionArgs, redirect } from 'react-router';

import { newProjectSchema } from './newProject.schema';

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const parsed = newProjectSchema.safeParse({
    localPath: formData.get('localPath'),
    name: formData.get('name'),
  });

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return {
      errors: {
        localPath: fieldErrors.localPath?.[0],
        name: fieldErrors.name?.[0],
      },
    };
  }

  try {
    const { projectId } = await registerProject(parsed.data);
    return redirect(`/cqms/projects/view/${projectId}`);
  } catch (error) {
    return {
      errors: {
        localPath:
          error instanceof Error
            ? error.message
            : 'Failed to register project.',
      },
    };
  }
};
