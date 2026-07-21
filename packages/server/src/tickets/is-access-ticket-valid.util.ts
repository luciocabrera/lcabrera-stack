import { timingSafeEqual } from 'node:crypto';

import { signAccessTicket } from './sign-access-ticket.util.ts';

type VerifyAccessTicketArgs = {
  readonly now: number;
  readonly secret: string;
  readonly subject: string;
  readonly ticket: string;
};

/**
 * Checks a ticket minted by `signAccessTicket` against the subject the
 * bearer is actually asking for. Returns a boolean and never throws, so a
 * garbage value from the wire simply fails to authorize.
 *
 * Three things must hold, and all three are load-bearing:
 *
 * 1. `expiresAt` parses as an exact integer and is still in the future —
 *    checked against the caller-supplied `now`, keeping this a pure
 *    function of its inputs.
 * 2. The signature matches one re-derived for **this** `subject`. A ticket
 *    issued for a different subject produces a different signature, so it
 *    cannot be replayed sideways.
 * 3. The comparison is `timingSafeEqual`, so a forger learns nothing from
 *    how long a rejection took. Lengths are compared first because
 *    `timingSafeEqual` throws on a mismatch; that leaks only the length of
 *    a value whose format is public anyway.
 *
 * `expiresAt` is parsed without a regular expression: `Number` plus a
 * round-trip through `String` rejects whitespace, signs, exponents and
 * anything beyond the safe-integer range, with no pattern to backtrack.
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
