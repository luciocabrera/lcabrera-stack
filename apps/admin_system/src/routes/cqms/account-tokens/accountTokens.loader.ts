import type { LoaderFunctionArgs } from 'react-router';

import { listApiTokens } from '@repo/scan-ingestion/queries/listApiTokens.util';

import { requireUser } from '@/auth/requireUser.util';

/**
 * Self-service page (ADR-029): any logged-in user manages their OWN API
 * tokens, so this gates on requireUser only — no role permission. Lists the
 * caller's live tokens (the read view never exposes the secret hash).
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await requireUser({ request });
  const tokens = await listApiTokens({ userId: user.id });

  return { tokens };
};
