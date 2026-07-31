import type { ActionFunctionArgs } from 'react-router';

import { saveProjectSnapshot } from '@repo/scan-ingestion/ingestion/snapshots/saveProjectSnapshot';
import { discoverProjectWorkspaces } from '@repo/scan-ingestion/ingestion/workspaces/discoverProjectWorkspaces.util';
import { checkUserPermission } from '@repo/scan-ingestion/queries/checkUserPermission.util';
import { replaceProjectWorkspaces } from '@repo/scan-ingestion/queries/replaceProjectWorkspaces.util';
import { data } from 'react-router';
import { z } from 'zod';

import { requireApiUser } from '@/auth/requireApiUser.util';

import { resolvePushSourceLabel } from './resolvePushSourceLabel.util';
import { validatePushArchive } from './validatePushArchive.util';

const paramsSchema = z.object({ projectId: z.uuid() });

// The CLI push channel (PRD_V2 §3, ADR-029): a token-authenticated upload of a
// whole-repo zip as the raw request body. Buffered in memory (like the browser
// sync), so bounded — but a much higher ceiling than the browser cap since the
// CLI is the intended path for real repo sizes. Override with CQMS_MAX_PUSH_BYTES.
const MAX_PUSH_BYTES =
  Number(process.env.CQMS_MAX_PUSH_BYTES) || 500 * 1024 * 1024;

/**
 * `POST /_action/push-snapshot/:projectId` — the CLI sync endpoint. Lives
 * OUTSIDE the cqms layout on purpose: that layout's loader calls requireUser
 * (cookie → 302 to /login), which a CLI can't follow. Authenticates with a
 * Bearer token instead, then reuses the exact browser sync flow
 * (saveProjectSnapshot + best-effort workspace discovery). Permission is
 * enforced authoritatively in Postgres by fn_set_project_snapshot; the
 * pre-flight checkUserPermission just fails fast before writing the archive
 * to disk (it mirrors that function's fn_assert_update_permission).
 */
export const action = async ({ params, request }: ActionFunctionArgs) => {
  const { userId } = await requireApiUser({ request });

  const parsed = paramsSchema.safeParse(params);
  if (!parsed.success) {
    throw data('Invalid project id.', { status: 400 });
  }
  const { projectId } = parsed.data;

  const permission = await checkUserPermission({
    action: 'update',
    resourceId: projectId,
    resourceType: 'project',
    userId,
  });
  if (!permission.allowed) {
    throw data(permission.reason, { status: 403 });
  }

  const archiveBytes = new Uint8Array(await request.arrayBuffer());
  const validated = validatePushArchive({
    byteLength: archiveBytes.byteLength,
    maxBytes: MAX_PUSH_BYTES,
  });
  if (!validated.ok) {
    throw data(validated.error, { status: validated.status });
  }

  const result = await saveProjectSnapshot({
    archiveBytes,
    archiveName: 'cli-push.zip',
    projectId,
    sourceLabel: resolvePushSourceLabel({
      host: request.headers.get('X-CodePulse-Host'),
    }),
    userId,
  });

  // Best-effort discovery — a failure here must never fail the sync itself
  // (ADR-021), same contract as the browser upload.
  try {
    await replaceProjectWorkspaces({
      projectId,
      userId,
      workspaces: discoverProjectWorkspaces({ rootPath: result.storagePath }),
    });
  } catch (workspaceError) {
    console.warn('Workspace discovery failed (non-fatal):', workspaceError);
  }

  return Response.json({
    fileCount: result.fileCount,
    sizeBytes: result.sizeBytes,
    snapshotId: result.snapshotId,
  });
};
