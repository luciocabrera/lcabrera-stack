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
 * authorize. Three things must hold:
 * 1. `expiresAt` is an exact integer still in the future, compared against the
 *    caller-supplied `now` (this stays pure).
 * 2. The signature matches one re-derived for **this** `subject` — a ticket for another
 *    subject cannot be replayed sideways.
 * 3. The compare is `timingSafeEqual`, with lengths checked first because that API throws
 *    on a length mismatch.
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
