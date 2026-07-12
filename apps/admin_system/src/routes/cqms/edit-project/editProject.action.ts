import { updateProject } from '@repo/scan-ingestion/queries/updateProject.util';
import { type ActionFunctionArgs, data, redirect } from 'react-router';
import { z } from 'zod';

import { requireUser } from '@/auth/requireUser.util';

import { editProjectSchema } from './editProject.schema';

const paramsSchema = z.object({ projectId: z.string().uuid() });

/**
 * Editing covers display fields only since ADR-028 — the project's code
 * location is whatever the latest synced snapshot is, so there is no path
 * to edit and no workspace re-discovery here anymore (discovery lives in
 * the sync-upload action, the only moment the code on disk changes).
 */
export const action = async ({ params, request }: ActionFunctionArgs) => {
  // Actions run BEFORE loaders, so the layout loader's gate does not
  // cover POSTs — every cqms action authenticates itself (ADR-017).
  const user = await requireUser({ request });

  const parsedParams = paramsSchema.safeParse(params);
  if (!parsedParams.success) {
    throw data('Invalid project id.', { status: 400 });
  }

  const formData = await request.formData();
  const parsed = editProjectSchema.safeParse({
    name: formData.get('name'),
  });

  if (!parsed.success) {
    return {
      errors: {
        name: parsed.error.flatten().fieldErrors.name?.[0],
      },
    };
  }

  try {
    await updateProject({
      ...parsed.data,
      projectId: parsedParams.data.projectId,
      userId: user.id,
    });

    return redirect(`/cqms/projects/view/${parsedParams.data.projectId}`);
  } catch (error) {
    return {
      errors: {
        name:
          error instanceof Error ? error.message : 'Failed to update project.',
      },
    };
  }
};
