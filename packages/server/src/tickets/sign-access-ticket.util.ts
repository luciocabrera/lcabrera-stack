import { createHmac } from 'node:crypto';

type SignAccessTicketArgs = {
  readonly expiresAt: number;
  readonly secret: string;
  readonly subject: string;
};

/**
 * Mints a short-lived, stateless capability for one `subject` — the id of
 * the single thing the bearer may access. Unlike the API tokens in
 * `../tokens/`, nothing is persisted: the ticket is an HMAC over
 * `[subject, expiresAt]`, so the holder of the secret can re-derive and
 * compare it without a lookup. That makes it the right shape for a channel
 * that must authorize on every connect with no database in the path.
 *
 * The wire format is `<expiresAt>.<signature>`. `expiresAt` travels in the
 * clear because the verifier needs it to check expiry, and it is covered by
 * the signature so a bearer cannot extend their own ticket. `subject` is
 * **not** transmitted — the verifier already knows which subject is being
 * requested and passes it in, which is what stops a ticket for one subject
 * being replayed against another.
 *
 * `expiresAt` is an epoch-millisecond argument rather than a TTL read off
 * the clock, so this stays a pure function of its inputs; the caller owns
 * the policy and the clock.
 *
 * Signing over `JSON.stringify([subject, expiresAt])` rather than the two
 * fields concatenated keeps the boundary between them unambiguous: no
 * subject value can be crafted that shifts it and produces a colliding
 * signature.
 */
export const signAccessTicket = ({
  expiresAt,
  secret,
  subject,
}: SignAccessTicketArgs): string => {
  const signature = createHmac('sha256', secret)
    .update(JSON.stringify([subject, expiresAt]))
    .digest('base64url');

  return `${expiresAt}.${signature}`;
};
