import { createHmac } from 'node:crypto';

type SignAuthPayloadArgs = {
  readonly payload: string;
  readonly secret: string;
};

/**
 * Shared by both the signing and verifying paths so the algorithm can never drift between
 * them.
 */
export const signAuthPayload = ({ payload, secret }: SignAuthPayloadArgs) =>
  createHmac('sha256', secret).update(payload).digest('hex');
