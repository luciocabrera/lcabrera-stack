import type {
  PermissionAction,
  PermissionResourceType,
} from '@repo/scan-ingestion/queries/checkUserPermission.util';

import { checkUserPermission } from '@repo/scan-ingestion/queries/checkUserPermission.util';
import { data } from 'react-router';

import { requireUser } from './requireUser.util';

type RequirePermissionArgs = {
  readonly action: PermissionAction;
  readonly request: Request;
  readonly resourceType: PermissionResourceType;
};

/**
 * The admin-route gate (ADR-024): requireUser first (redirects to /login),
 * then a type-wide checkUserPermission — 403 carrying the DB's own
 * human-readable reason when the session user lacks it. Route-level ONLY:
 * every write function still asserts inside Postgres; this just keeps
 * pages from rendering for users whose every action would be rejected
 * anyway.
 */
export const requirePermission = async ({
  action,
  request,
  resourceType,
}: RequirePermissionArgs) => {
  const user = await requireUser({ request });

  const result = await checkUserPermission({
    action,
    resourceType,
    userId: user.id,
  });
  if (!result.allowed) {
    throw data(result.reason, { status: 403 });
  }

  return user;
};
