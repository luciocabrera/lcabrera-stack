import type { ActionFunctionArgs } from 'react-router';

import { saveProjectSnapshot } from '@repo/scan-ingestion/ingestion/snapshots/saveProjectSnapshot';
import { discoverProjectWorkspaces } from '@repo/scan-ingestion/ingestion/workspaces/discoverProjectWorkspaces.util';
import { createResourceGrant } from '@repo/scan-ingestion/queries/createResourceGrant.util';
import { deleteResourceGrant } from '@repo/scan-ingestion/queries/deleteResourceGrant.util';
import { replaceProjectWorkspaces } from '@repo/scan-ingestion/queries/replaceProjectWorkspaces.util';
import { z } from 'zod';

import { requireUser } from '@/auth/requireUser.util';

import { parseRouteParams } from '../utils/parseRouteParams.util';

const paramsSchema = z.object({ projectId: z.string().uuid() });

// Browser uploads buffer in memory (native request.formData()) — cap them.
// The CLI push channel (next increment) is the intended path for big repos.
const MAX_ARCHIVE_BYTES = 200 * 1024 * 1024;

type HandleSyncUploadArgs = {
  readonly formData: FormData;
  readonly projectId: string;
  readonly userId: string;
};

const handleSyncUpload = async ({
  formData,
  projectId,
  userId,
}: HandleSyncUploadArgs) => {
  const archive = formData.get('archive');
  if (!(archive instanceof File) || archive.size === 0) {
    return { syncError: 'Pick a .zip archive of the repository to upload.' };
  }
  if (!archive.name.toLowerCase().endsWith('.zip')) {
    return { syncError: 'Only .zip archives are supported.' };
  }
  if (archive.size > MAX_ARCHIVE_BYTES) {
    return {
      syncError: `Archive is too large for browser upload (max ${MAX_ARCHIVE_BYTES / (1024 * 1024)} MB) — use the CLI push instead.`,
    };
  }

  const { storagePath } = await saveProjectSnapshot({
    archiveBytes: new Uint8Array(await archive.arrayBuffer()),
    archiveName: archive.name,
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
};

const addGrantSchema = z.object({
  granteeUserId: z.string().uuid('Pick a user.'),
  // 'action:resourceType', from the curated GRANT_OPTIONS list.
  permission: z.string().regex(/^[a-z]+:[a-z]+$/, 'Pick a permission.'),
});

/**
 * The project page's fetcher endpoint: intent 'grant-add' / 'grant-delete'
 * (the grants editor, ADR-024) and 'sync-upload' (the snapshot sync panel,
 * ADR-028). The DB functions assert their own permissions in Postgres —
 * rejections come back as `grantError`/`syncError` for the panels to
 * render inline.
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
  const intent = formData.get('intent');

  if (intent === 'sync-upload') {
    try {
      return await handleSyncUpload({
        formData,
        projectId,
        userId: user.id,
      });
    } catch (error) {
      return {
        syncError:
          error instanceof Error ? error.message : 'Snapshot upload failed.',
      };
    }
  }

  try {
    if (intent === 'grant-add') {
      const parsed = addGrantSchema.safeParse({
        granteeUserId: formData.get('granteeUserId'),
        permission: formData.get('permission'),
      });
      if (!parsed.success) {
        return {
          grantError: parsed.error.issues[0]?.message ?? 'Invalid grant.',
        };
      }
      const [action_, resourceType] = parsed.data.permission.split(':', 2);
      await createResourceGrant({
        action: action_ ?? '',
        granteeUserId: parsed.data.granteeUserId,
        resourceId: projectId,
        resourceType: resourceType ?? '',
        userId: user.id,
      });
      return { ok: true };
    }

    if (intent === 'grant-delete') {
      const grantId = z.string().uuid().safeParse(formData.get('grantId'));
      if (!grantId.success) {
        return { grantError: 'Invalid grant id.' };
      }
      await deleteResourceGrant({ grantId: grantId.data, userId: user.id });
      return { ok: true };
    }

    return { grantError: 'Unknown intent.' };
  } catch (error) {
    return {
      grantError:
        error instanceof Error ? error.message : 'Grant change failed.',
    };
  }
};
