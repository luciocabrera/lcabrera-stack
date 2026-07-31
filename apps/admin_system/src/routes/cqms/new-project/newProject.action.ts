import type { ActionFunctionArgs } from 'react-router';

import { registerProject } from '@repo/scan-ingestion/queries/registerProject.util';
import { redirect } from 'react-router';

import { requireUser } from '@/auth/requireUser.util';

import { newProjectSchema } from './newProject.schema';

/**
 * Registration is identity-only since ADR-028 — the project's code arrives
 * afterwards as a synced snapshot (project page → Code Snapshot panel), so
 * there is no path to validate and no workspace discovery here anymore
 * (discovery moved to the sync-upload action, the only moment the code on
 * disk changes).
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  // Actions run BEFORE loaders, so the layout loader's gate does not
  // cover POSTs — every cqms action authenticates itself (ADR-017).
  const user = await requireUser({ request });

  const formData = await request.formData();
  const parsed = newProjectSchema.safeParse({
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
    const { projectId } = await registerProject({
      ...parsed.data,
      userId: user.id,
    });

    return redirect(`/cqms/projects/view/${projectId}`);
  } catch (error) {
    return {
      errors: {
        name:
          error instanceof Error
            ? error.message
            : 'Failed to register project.',
      },
    };
  }
};
