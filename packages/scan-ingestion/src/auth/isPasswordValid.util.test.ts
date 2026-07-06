import { describe, expect, it } from 'vitest';

import { hashPassword } from './hashPassword.util.ts';
import { isPasswordValid } from './isPasswordValid.util.ts';

describe('isPasswordValid', () => {
  it('verifies a password against its own hash', () => {
    const passwordHash = hashPassword({ password: 'secret-123' });

    expect(isPasswordValid({ password: 'secret-123', passwordHash })).toBe(
      true,
    );
  });

  it('rejects a wrong password', () => {
    const passwordHash = hashPassword({ password: 'secret-123' });

    expect(isPasswordValid({ password: 'wrong', passwordHash })).toBe(false);
  });

  it('rejects a non-loginable sentinel hash without throwing', () => {
    expect(
      isPasswordValid({ password: 'anything', passwordHash: '!no-login!' }),
    ).toBe(false);
  });

  it('rejects an empty stored hash', () => {
    expect(isPasswordValid({ password: 'anything', passwordHash: '' })).toBe(
      false,
    );
  });
});
