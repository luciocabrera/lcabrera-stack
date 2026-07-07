import { discoverProjectWorkspaces } from '@repo/scan-ingestion/ingestion/workspaces/discoverProjectWorkspaces.util';
import { getProjectById } from '@repo/scan-ingestion/queries/getProjectById.util';
import { registerProject } from '@repo/scan-ingestion/queries/registerProject.util';
import { replaceProjectWorkspaces } from '@repo/scan-ingestion/queries/replaceProjectWorkspaces.util';
import { type ActionFunctionArgs, redirect } from 'react-router';

import { requireUser } from '@/auth/requireUser.util';

import { newProjectSchema } from './newProject.schema';

export const action = async ({ request }: ActionFunctionArgs) => {
  // Actions run BEFORE loaders, so the layout loader's gate does not
  // cover POSTs — every cqms action authenticates itself (ADR-017).
  const user = await requireUser({ request });

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
    const { projectId } = await registerProject({
      ...parsed.data,
      userId: user.id,
    });

    // Best-effort workspace discovery (ADR-021) — against the STORED
    // (canonicalized) path, not the raw form value; a failure must never
    // block registration.
    try {
      const project = await getProjectById({ projectId });
      if (project) {
        await replaceProjectWorkspaces({
          projectId,
          userId: user.id,
          workspaces: discoverProjectWorkspaces({
            rootPath: project.local_path,
          }),
        });
      }
    } catch (workspaceError) {
      console.warn('Workspace discovery failed (non-fatal):', workspaceError);
    }

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
