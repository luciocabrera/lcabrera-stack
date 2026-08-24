import { createHmac } from 'node:crypto';

type SignAccessTicketArgs = {
  readonly expiresAt: number;
  readonly secret: string;
  readonly subject: string;
};

/**
 * `expiresAt` travels in the clear because the verifier needs it to check expiry, and it
 * is covered by the signature so a bearer cannot extend their own ticket.
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
