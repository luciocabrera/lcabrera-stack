import { verifyApiToken } from '@repo/scan-ingestion/queries/verifyApiToken.util';
import { data } from 'react-router';

type RequireApiUserArgs = {
  readonly request: Request;
};

/**
 * The Bearer-token auth gate for CLI/API requests (ADR-029). Unlike
 * requireUser — which reads the cookie session and throws a 302 redirect to
 * /login (useless to a CLI) — this reads `Authorization: Bearer <token>` and
 * throws a 401 `data()` response for any failure (missing/malformed header,
 * or an unknown/revoked/expired/wrong token). On success it returns the
 * owning user's id, which then flows into the same Postgres permission gates
 * as the interactive path.
 */
export const requireApiUser = async ({ request }: RequireApiUserArgs) => {
  const bearer = request.headers
    .get('Authorization')
    ?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (bearer === undefined) {
    throw data('Unauthorized', { status: 401 });
  }

  const verified = await verifyApiToken(bearer);
  if (verified === undefined) {
    throw data('Unauthorized', { status: 401 });
  }

  return { userId: verified.userId };
};
