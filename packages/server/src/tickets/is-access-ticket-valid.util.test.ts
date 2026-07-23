import { describe, expect, it } from 'vite-plus/test';

import { isAccessTicketValid } from './is-access-ticket-valid.util.ts';
import { signAccessTicket } from './sign-access-ticket.util.ts';

const NOW = 1_800_000_000_000;
const SECRET = 'ticket-secret';
const SUBJECT = 'run-1';

const validTicket = signAccessTicket({
  expiresAt: NOW + 60_000,
  secret: SECRET,
  subject: SUBJECT,
});

describe('isAccessTicketValid', () => {
  it('accepts a ticket it just signed for the same subject', () => {
    expect(
      isAccessTicketValid({
        now: NOW,
        secret: SECRET,
        subject: SUBJECT,
        ticket: validTicket,
      }),
    ).toBe(true);
  });

  it('rejects a ticket minted for a different subject', () => {
    // The core guarantee: a ticket is a capability for one subject, not a
    // pass to the channel. Without this, any authorized bearer could listen
    // in on every other subject.
    expect(
      isAccessTicketValid({
        now: NOW,
        secret: SECRET,
        subject: 'run-2',
        ticket: validTicket,
      }),
    ).toBe(false);
  });

  it('rejects a ticket signed with a different secret', () => {
    expect(
      isAccessTicketValid({
        now: NOW,
        secret: 'other-secret',
        subject: SUBJECT,
        ticket: validTicket,
      }),
    ).toBe(false);
  });

  it('rejects an expired ticket', () => {
    expect(
      isAccessTicketValid({
        now: NOW + 60_001,
        secret: SECRET,
        subject: SUBJECT,
        ticket: validTicket,
      }),
    ).toBe(false);
  });

  it('rejects a ticket that expires exactly now', () => {
    const ticket = signAccessTicket({
      expiresAt: NOW,
      secret: SECRET,
      subject: SUBJECT,
    });

    expect(
      isAccessTicketValid({
        now: NOW,
        secret: SECRET,
        subject: SUBJECT,
        ticket,
      }),
    ).toBe(false);
  });

  it('rejects an expiry rewritten to a later time', () => {
    // Extending a ticket by editing the cleartext half must fail: the expiry
    // is inside the signed payload, so the signature no longer matches.
    const [, signature] = validTicket.split('.', 2);
    const forged = `${NOW + 86_400_000}.${signature}`;

    expect(
      isAccessTicketValid({
        now: NOW,
        secret: SECRET,
        subject: SUBJECT,
        ticket: forged,
      }),
    ).toBe(false);
  });

  it.each([
    { case: 'empty', ticket: '' },
    { case: 'no separator', ticket: 'nonsense' },
    { case: 'leading separator', ticket: '.signature' },
    { case: 'non-numeric expiry', ticket: 'soon.signature' },
    { case: 'whitespace-padded expiry', ticket: ` ${NOW + 60_000}.signature` },
    { case: 'exponent-notation expiry', ticket: '1e21.signature' },
    { case: 'extra segment', ticket: `${NOW + 60_000}.5.signature` },
    { case: 'missing signature', ticket: `${NOW + 60_000}.` },
  ])('rejects a malformed ticket ($case) without throwing', ({ ticket }) => {
    expect(
      isAccessTicketValid({
        now: NOW,
        secret: SECRET,
        subject: SUBJECT,
        ticket,
      }),
    ).toBe(false);
  });

  it('rejects a signature of the right length but wrong content', () => {
    // Guards the length pre-check in front of timingSafeEqual: equal lengths
    // must still reach a real comparison, not short-circuit to accepted.
    const [expiresAt, signature] = validTicket.split('.', 2);
    const flipped = signature?.startsWith('A')
      ? `B${signature.slice(1)}`
      : `A${signature?.slice(1)}`;

    expect(
      isAccessTicketValid({
        now: NOW,
        secret: SECRET,
        subject: SUBJECT,
        ticket: `${expiresAt}.${flipped}`,
      }),
    ).toBe(false);
  });
});
