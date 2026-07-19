import { createHmac } from 'node:crypto';

type SignAuthPayloadArgs = {
  readonly payload: string;
  readonly secret: string;
};

/**
 * Deterministic HMAC-SHA256 signature (hex) of a token payload. Pure: the same
 * `payload`/`secret` always yield the same signature, which is exactly what
 * lets `verifyAuthToken` recompute and compare it statelessly (no stored
 * secret to look up). Shared by both the signing and verifying paths so the
 * algorithm can never drift between them.
 *
 * Server-only (`node:crypto`) — hence the `.server.ts` suffix.
 */
export const signAuthPayload = ({ payload, secret }: SignAuthPayloadArgs) =>
  createHmac('sha256', secret).update(payload).digest('hex');
