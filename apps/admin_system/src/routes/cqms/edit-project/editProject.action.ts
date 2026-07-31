import { updateProject } from '@repo/scan-ingestion/queries/updateProject.util';
import { type ActionFunctionArgs, redirect } from 'react-router';
import { z } from 'zod';

import { requireUser } from '@/auth/requireUser.util';

import { parseRouteParams } from '../utils/parseRouteParams.util';
import { editProjectSchema } from './editProject.schema';

const paramsSchema = z.object({ projectId: z.uuid() });

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

  const { projectId } = parseRouteParams({
    invalidMessage: 'Invalid project id.',
    params,
    schema: paramsSchema,
  });

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
      projectId: projectId,
      userId: user.id,
    });

    return redirect(`/cqms/projects/view/${projectId}`);
  } catch (error) {
    return {
      errors: {
        name:
          error instanceof Error ? error.message : 'Failed to update project.',
      },
    };
  }
};
