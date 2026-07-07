import { createResourceGrant } from '@repo/scan-ingestion/queries/createResourceGrant.util';
import { deleteResourceGrant } from '@repo/scan-ingestion/queries/deleteResourceGrant.util';
import { type ActionFunctionArgs, data } from 'react-router';
import { z } from 'zod';

import { requireUser } from '@/auth/requireUser.util';

const paramsSchema = z.object({ projectId: z.string().uuid() });

const addGrantSchema = z.object({
  granteeUserId: z.string().uuid('Pick a user.'),
  // 'action:resourceType', from the curated GRANT_OPTIONS list.
  permission: z.string().regex(/^[a-z]+:[a-z]+$/, 'Pick a permission.'),
});

/**
 * The grants editor's fetcher endpoint (ADR-024): intent 'grant-add' /
 * 'grant-delete'. fn_create_resource_grant / fn_delete_resource_grant
 * assert 'update' on the grant's resource type in Postgres — a rejection
 * comes back as `grantError` for the panel to render inline.
 */
export const action = async ({ params, request }: ActionFunctionArgs) => {
  // Actions run BEFORE loaders — every cqms action authenticates itself
  // (ADR-017).
  const user = await requireUser({ request });

  const parsedParams = paramsSchema.safeParse(params);
  if (!parsedParams.success) {
    throw data('Invalid project id.', { status: 400 });
  }
  const { projectId } = parsedParams.data;

  const formData = await request.formData();
  const intent = formData.get('intent');

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
      const [action_, resourceType] = parsed.data.permission.split(':');
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
