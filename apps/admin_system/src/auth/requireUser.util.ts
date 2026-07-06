import {
  getUserById,
  type UserRow,
} from '@repo/scan-ingestion/queries/getUserById.util';
import { redirect } from 'react-router';

import { getSessionStorage } from './getSessionStorage.util';

type RequireUserArgs = {
  readonly request: Request;
};

/**
 * The auth gate every CQMS loader/action calls first (ADR-017 — chosen
 * over the v8_middleware flag; a shared helper is the established
 * pre-middleware pattern). Validates the session's userId against
 * cqms.v_users on every call, so a user disabled or soft-deleted after
 * login is kicked on their next request, not at cookie expiry. Throws a
 * redirect to /login (preserving the original destination) — callers
 * just await it and use the returned user.
 */
export const requireUser = async ({
  request,
}: RequireUserArgs): Promise<UserRow> => {
  const { getSession } = getSessionStorage();
  const session = await getSession(request.headers.get('Cookie'));
  const userId = session.get('userId');

  const url = new URL(request.url);
  const redirectTo = `${url.pathname}${url.search}`;
  const loginUrl = `/login?redirectTo=${encodeURIComponent(redirectTo)}`;

  if (userId === undefined) {
    throw redirect(loginUrl);
  }

  const user = await getUserById({ userId });
  if (user === undefined) {
    throw redirect(loginUrl);
  }

  return user;
};
