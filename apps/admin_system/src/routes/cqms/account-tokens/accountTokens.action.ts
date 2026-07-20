import type { ActionFunctionArgs } from 'react-router';

import { issueApiToken } from '@repo/scan-ingestion/queries/issueApiToken.util';
import { revokeApiToken } from '@repo/scan-ingestion/queries/revokeApiToken.util';
import { getErrorMessage } from '@repo/utils/errors/get-error-message.util';
import { z } from 'zod';

import { requireUser } from '@/auth/requireUser.util';

import { getFirstIssueMessage } from '../utils/getFirstIssueMessage.util';

const issueSchema = z.object({
  name: z.string().min(1, 'Name the token.').max(100),
});
const revokeSchema = z.object({ tokenId: z.string().min(1) });

/**
 * Self-service token issuance/revocation for the acting user (ADR-029). The
 * DB functions enforce ownership; issuance returns the plaintext exactly once
 * for the page to display. Typed failures come back as `tokenError` for inline
 * rendering.
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await requireUser({ request });
  const formData = await request.formData();
  const intent = formData.get('intent');

  try {
    if (intent === 'token-issue') {
      const parsed = issueSchema.safeParse({ name: formData.get('name') });
      if (!parsed.success) {
        return {
          tokenError: getFirstIssueMessage({
            error: parsed.error,
            fallback: 'Invalid token name.',
          }),
        };
      }
      const { plaintext } = await issueApiToken({
        name: parsed.data.name,
        userId: user.id,
      });
      return { plaintext };
    }

    if (intent === 'token-revoke') {
      const parsed = revokeSchema.safeParse({
        tokenId: formData.get('tokenId'),
      });
      if (!parsed.success) {
        return { tokenError: 'Invalid token.' };
      }
      await revokeApiToken({ tokenId: parsed.data.tokenId, userId: user.id });
      return { ok: true };
    }

    return { tokenError: 'Unknown intent.' };
  } catch (error) {
    return {
      tokenError: getErrorMessage({
        error,
        fallback: 'Token operation failed.',
      }),
    };
  }
};
