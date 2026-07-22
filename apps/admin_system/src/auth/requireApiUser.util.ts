import { verifyApiToken } from '@repo/scan-ingestion/queries/verifyApiToken.util';
import { data } from 'react-router';

// Lower-cased: the scheme token is case-insensitive per RFC 7235, and the
// header is compared after lower-casing rather than with an /i regex.
const BEARER_PREFIX = 'bearer ';

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
  // Matched by prefix rather than by `/^Bearer\s+(.+)$/i`. That pattern put a
  // greedy `\s+` next to a greedy `.+` over overlapping character classes, so
  // a header of the form `Bearer ` followed by a long whitespace run made the
  // engine backtrack quadratically — an attacker-controlled header is exactly
  // the wrong place for super-linear matching. Prefix + slice is linear and
  // accepts the same values.
  const header = request.headers.get('Authorization') ?? '';
  const bearer = header.toLowerCase().startsWith(BEARER_PREFIX)
    ? header.slice(BEARER_PREFIX.length).trim()
    : '';
  if (bearer === '') {
    throw data('Unauthorized', { status: 401 });
  }

  const verified = await verifyApiToken(bearer);
  if (verified === undefined) {
    throw data('Unauthorized', { status: 401 });
  }

  return { userId: verified.userId };
};
