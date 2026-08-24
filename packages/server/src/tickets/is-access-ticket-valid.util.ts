import { timingSafeEqual } from 'node:crypto';

import { signAccessTicket } from './sign-access-ticket.util.ts';

type VerifyAccessTicketArgs = {
  readonly now: number;
  readonly secret: string;
  readonly subject: string;
  readonly ticket: string;
};

/**
 * Returns a boolean and never throws, so a garbage value from the wire simply fails to
 * authorize.
 * Three things must hold, and all three are load-bearing: 1.
 * A ticket issued for a different subject produces a different signature, so it cannot be
 * replayed sideways.
 */
export const isAccessTicketValid = ({
  now,
  secret,
  subject,
  ticket,
}: VerifyAccessTicketArgs): boolean => {
  const separatorIndex = ticket.indexOf('.');
  if (separatorIndex <= 0) {
    return false;
  }

  const expiresAtRaw = ticket.slice(0, separatorIndex);
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isSafeInteger(expiresAt) || String(expiresAt) !== expiresAtRaw) {
    return false;
  }

  if (expiresAt <= now) {
    return false;
  }

  const presented = Buffer.from(ticket, 'utf8');
  const expected = Buffer.from(
    signAccessTicket({ expiresAt, secret, subject }),
    'utf8',
  );

  return (
    presented.length === expected.length && timingSafeEqual(presented, expected)
  );
};
