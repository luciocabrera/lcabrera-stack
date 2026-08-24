import { createHmac } from 'node:crypto';

type SignAccessTicketArgs = {
  readonly expiresAt: number;
  readonly secret: string;
  readonly subject: string;
};

/**
 * Wire format is `<expiresAt>.<signature>`. `expiresAt` travels in the clear so the
 * verifier can check expiry, and is covered by the signature so a bearer cannot extend
 * it. `subject` is not transmitted — the verifier passes in the subject it is being asked
 * about, which is why a ticket for one subject cannot be replayed against another.
 * HMAC is over `JSON.stringify([subject, expiresAt])`, so no crafted `subject` can shift
 * the boundary and collide.
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
