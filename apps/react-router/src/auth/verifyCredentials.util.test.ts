import { describe, expect, it } from 'vitest';

import { getDemoCredential } from './getDemoCredential.util';
import { verifyCredentials } from './verifyCredentials.util';

const DEMO_PASSWORD = 'demo-password-123';
const credential = getDemoCredential({ env: {} });

describe('verifyCredentials', () => {
  it('accepts the correct email and password', () => {
    expect(
      verifyCredentials({
        credential,
        email: credential.email,
        password: DEMO_PASSWORD,
      }),
    ).toBe(true);
  });

  it('matches the email case-insensitively', () => {
    expect(
      verifyCredentials({
        credential,
        email: credential.email.toUpperCase(),
        password: DEMO_PASSWORD,
      }),
    ).toBe(true);
  });

  it('rejects a wrong password', () => {
    expect(
      verifyCredentials({
        credential,
        email: credential.email,
        password: 'wrong-password',
      }),
    ).toBe(false);
  });

  it('rejects an unknown email', () => {
    expect(
      verifyCredentials({
        credential,
        email: 'intruder@example.com',
        password: DEMO_PASSWORD,
      }),
    ).toBe(false);
  });
});
