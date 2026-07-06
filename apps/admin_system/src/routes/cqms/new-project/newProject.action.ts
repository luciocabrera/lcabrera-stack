import { registerProject } from '@repo/scan-ingestion/queries/registerProject.util';
import { type ActionFunctionArgs, redirect } from 'react-router';

import { requireUser } from '@/auth/requireUser.util';

import { newProjectSchema } from './newProject.schema';

export const action = async ({ request }: ActionFunctionArgs) => {
  // Actions run BEFORE loaders, so the layout loader's gate does not
  // cover POSTs — every cqms action authenticates itself (ADR-017).
  await requireUser({ request });

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
