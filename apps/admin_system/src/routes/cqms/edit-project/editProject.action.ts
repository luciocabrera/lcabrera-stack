import { updateProject } from '@repo/scan-ingestion/queries/updateProject.util';
import { type ActionFunctionArgs, data, redirect } from 'react-router';
import { z } from 'zod';

import { requireUser } from '@/auth/requireUser.util';

import { editProjectSchema } from './editProject.schema';

const paramsSchema = z.object({ projectId: z.string().uuid() });

export const action = async ({ params, request }: ActionFunctionArgs) => {
  // Actions run BEFORE loaders, so the layout loader's gate does not
  // cover POSTs — every cqms action authenticates itself (ADR-017).
  await requireUser({ request });

  const parsedParams = paramsSchema.safeParse(params);
  if (!parsedParams.success) {
    throw data('Invalid project id.', { status: 400 });
  }

  const formData = await request.formData();
  const parsed = editProjectSchema.safeParse({
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
    await updateProject({
      ...parsed.data,
      projectId: parsedParams.data.projectId,
    });
    return redirect(`/cqms/projects/view/${parsedParams.data.projectId}`);
  } catch (error) {
    return {
      errors: {
        localPath:
          error instanceof Error ? error.message : 'Failed to update project.',
      },
    };
  }
};
