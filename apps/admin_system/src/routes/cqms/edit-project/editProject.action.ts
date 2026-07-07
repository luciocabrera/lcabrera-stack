import { discoverProjectWorkspaces } from '@repo/scan-ingestion/ingestion/workspaces/discoverProjectWorkspaces.util';
import { getProjectById } from '@repo/scan-ingestion/queries/getProjectById.util';
import { replaceProjectWorkspaces } from '@repo/scan-ingestion/queries/replaceProjectWorkspaces.util';
import { updateProject } from '@repo/scan-ingestion/queries/updateProject.util';
import { type ActionFunctionArgs, data, redirect } from 'react-router';
import { z } from 'zod';

import { requireUser } from '@/auth/requireUser.util';

import { editProjectSchema } from './editProject.schema';

const paramsSchema = z.object({ projectId: z.string().uuid() });

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
      userId: user.id,
    });

    // Best-effort workspace re-discovery (ADR-021) — the local path may
    // have changed; against the STORED (canonicalized) path, non-fatal.
    try {
      const project = await getProjectById({
        projectId: parsedParams.data.projectId,
      });
      if (project) {
        await replaceProjectWorkspaces({
          projectId: project.id,
          userId: user.id,
          workspaces: discoverProjectWorkspaces({
            rootPath: project.local_path,
          }),
        });
      }
    } catch (workspaceError) {
      console.warn('Workspace discovery failed (non-fatal):', workspaceError);
    }

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
