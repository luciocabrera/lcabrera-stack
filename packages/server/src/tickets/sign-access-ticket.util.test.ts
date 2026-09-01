import { describe, expect, it } from 'vite-plus/test';

import { signAccessTicket } from './sign-access-ticket.util.ts';

const EXPIRES_AT = 1_800_000_000_000;

describe('signAccessTicket', () => {
  it('puts the expiry in the clear so a verifier can read it back', () => {
    const ticket = signAccessTicket({
      expiresAt: EXPIRES_AT,
      secret: 'secret',
      subject: 'run-1',
    });

    expect(ticket.startsWith(`${EXPIRES_AT}.`)).toBe(true);
  });

  it('is deterministic for the same inputs', () => {
    const args = {
      expiresAt: EXPIRES_AT,
      secret: 'secret',
      subject: 'run-1',
    };

    expect(signAccessTicket(args)).toBe(signAccessTicket(args));
  });

  it('signs the subject, so two subjects never share a signature', () => {
    const first = signAccessTicket({
      expiresAt: EXPIRES_AT,
      secret: 'secret',
      subject: 'run-1',
    });
    const second = signAccessTicket({
      expiresAt: EXPIRES_AT,
      secret: 'secret',
      subject: 'run-2',
    });

    expect(first).not.toBe(second);
  });

  it('signs the expiry, so a bearer cannot extend their own ticket', () => {
    const first = signAccessTicket({
      expiresAt: EXPIRES_AT,
      secret: 'secret',
      subject: 'run-1',
    });
    const second = signAccessTicket({
      expiresAt: EXPIRES_AT + 1,
      secret: 'secret',
      subject: 'run-1',
    });

    expect(first.split('.', 2)[1]).not.toBe(second.split('.', 2)[1]);
  });

  it('depends on the secret', () => {
    const first = signAccessTicket({
      expiresAt: EXPIRES_AT,
      secret: 'secret-a',
      subject: 'run-1',
    });
    const second = signAccessTicket({
      expiresAt: EXPIRES_AT,
      secret: 'secret-b',
      subject: 'run-1',
    });

    expect(first).not.toBe(second);
  });

  it('cannot be collided by shifting the subject/expiry boundary', () => {
    const first = signAccessTicket({
      expiresAt: 2,
      secret: 'secret',
      subject: 'run1',
    });
    const second = signAccessTicket({
      expiresAt: 12,
      secret: 'secret',
      subject: 'run',
    });

    expect(first.split('.', 2)[1]).not.toBe(second.split('.', 2)[1]);
  });

  it('emits a url-safe signature, so it survives a query string unescaped', () => {
    const signature = signAccessTicket({
      expiresAt: EXPIRES_AT,
      secret: 'secret',
      subject: 'run-1',
    }).split('.', 2)[1];

    expect(signature).toMatch(/^[\w-]+$/);
  });
});
