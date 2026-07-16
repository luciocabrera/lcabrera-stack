import type { ActionFunctionArgs } from 'react-router';

import { getErrorMessage } from '@repo/data-access/errors/getErrorMessage.util';
import { saveProjectSnapshot } from '@repo/scan-ingestion/ingestion/snapshots/saveProjectSnapshot';
import { discoverProjectWorkspaces } from '@repo/scan-ingestion/ingestion/workspaces/discoverProjectWorkspaces.util';
import { createResourceGrant } from '@repo/scan-ingestion/queries/createResourceGrant.util';
import { deleteResourceGrant } from '@repo/scan-ingestion/queries/deleteResourceGrant.util';
import { replaceProjectWorkspaces } from '@repo/scan-ingestion/queries/replaceProjectWorkspaces.util';
import { z } from 'zod';

import { requireUser } from '@/auth/requireUser.util';

import { getFirstIssueMessage } from '../utils/getFirstIssueMessage.util';
import { parseRouteParams } from '../utils/parseRouteParams.util';
import { parseGrantPermission } from './parseGrantPermission.util';
import { validateSyncArchive } from './validateSyncArchive.util';

const paramsSchema = z.object({ projectId: z.string().uuid() });

const addGrantSchema = z.object({
  granteeUserId: z.string().uuid('Pick a user.'),
  // 'action:resourceType', from the curated GRANT_OPTIONS list.
  permission: z.string().regex(/^[a-z]+:[a-z]+$/, 'Pick a permission.'),
});

type IntentHandlerArgs = {
  readonly formData: FormData;
  readonly projectId: string;
  readonly userId: string;
};

const handleSyncUpload = async ({
  formData,
  projectId,
  userId,
}: IntentHandlerArgs) => {
  const validated = validateSyncArchive({ archive: formData.get('archive') });
  if (!validated.ok) {
    return { syncError: validated.error };
  }

  try {
    const { storagePath } = await saveProjectSnapshot({
      archiveBytes: new Uint8Array(await validated.archive.arrayBuffer()),
      archiveName: validated.archive.name,
      projectId,
      sourceLabel: 'browser-upload',
      userId,
    });

    // Workspace discovery (ADR-021) now happens HERE — the sync step is the
    // only moment the code on disk changes (ADR-028). Best-effort: a
    // discovery failure must never fail the sync itself.
    try {
      await replaceProjectWorkspaces({
        projectId,
        userId,
        workspaces: discoverProjectWorkspaces({ rootPath: storagePath }),
      });
    } catch (workspaceError) {
      console.warn('Workspace discovery failed (non-fatal):', workspaceError);
    }

    return { ok: true };
  } catch (error) {
    return {
      syncError: getErrorMessage({
        error,
        fallback: 'Snapshot upload failed.',
      }),
    };
  }
};

const handleGrantAdd = async ({
  formData,
  projectId,
  userId,
}: IntentHandlerArgs) => {
  const parsed = addGrantSchema.safeParse({
    granteeUserId: formData.get('granteeUserId'),
    permission: formData.get('permission'),
  });
  if (!parsed.success) {
    return {
      grantError: getFirstIssueMessage({
        error: parsed.error,
        fallback: 'Invalid grant.',
      }),
    };
  }

  const { action, resourceType } = parseGrantPermission({
    permission: parsed.data.permission,
  });

  try {
    await createResourceGrant({
      action,
      granteeUserId: parsed.data.granteeUserId,
      resourceId: projectId,
      resourceType,
      userId,
    });
    return { ok: true };
  } catch (error) {
    return {
      grantError: getErrorMessage({ error, fallback: 'Grant change failed.' }),
    };
  }
};

const handleGrantDelete = async ({ formData, userId }: IntentHandlerArgs) => {
  const grantId = z.string().uuid().safeParse(formData.get('grantId'));
  if (!grantId.success) {
    return { grantError: 'Invalid grant id.' };
  }

  try {
    await deleteResourceGrant({ grantId: grantId.data, userId });
    return { ok: true };
  } catch (error) {
    return {
      grantError: getErrorMessage({ error, fallback: 'Grant change failed.' }),
    };
  }
};

/**
 * The project page's fetcher endpoint: intent 'grant-add' / 'grant-delete'
 * (the grants editor, ADR-024) and 'sync-upload' (the snapshot sync panel,
 * ADR-028). The DB functions assert their own permissions in Postgres —
 * rejections come back as `grantError`/`syncError` for the panels to
 * render inline.
 *
 * Each intent owns its own error boundary rather than sharing one around the
 * dispatch, so its failures land on the key its panel reads.
 */
export const action = async ({ params, request }: ActionFunctionArgs) => {
  // Actions run BEFORE loaders — every cqms action authenticates itself
  // (ADR-017).
  const user = await requireUser({ request });

  const { projectId } = parseRouteParams({
    invalidMessage: 'Invalid project id.',
    params,
    schema: paramsSchema,
  });

  const formData = await request.formData();
  const handlerArgs = { formData, projectId, userId: user.id };
  const intent = formData.get('intent');

  if (intent === 'sync-upload') {
    return await handleSyncUpload(handlerArgs);
  }
  if (intent === 'grant-add') {
    return await handleGrantAdd(handlerArgs);
  }
  if (intent === 'grant-delete') {
    return await handleGrantDelete(handlerArgs);
  }

  return { grantError: 'Unknown intent.' };
};
