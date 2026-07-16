import { describe, expect, it } from 'vitest';

import { loginSchema } from './login.schema';
import { toLoginFieldErrors } from './toLoginFieldErrors.util';

const parseErrors = (values: Readonly<Record<string, unknown>>) => {
  const parsed = loginSchema.safeParse(values);
  if (parsed.success) {
    throw new Error('Expected the fixture to fail validation.');
  }
  return toLoginFieldErrors({ error: parsed.error });
};

describe('toLoginFieldErrors', () => {
  it('surfaces a missing username', () => {
    expect(parseErrors({ password: 'hunter2', username: '' })).toEqual({
      password: undefined,
      username: 'Username is required.',
    });
  });

  it('surfaces a missing password', () => {
    expect(parseErrors({ password: '', username: 'ada' })).toEqual({
      password: 'Password is required.',
      username: undefined,
    });
  });

  it('surfaces both fields at once', () => {
    expect(parseErrors({ password: '', username: '' })).toEqual({
      password: 'Password is required.',
      username: 'Username is required.',
    });
  });

  it('reports the wrong-type case rather than dropping it', () => {
    // FormData.get returns null for a missing field, which is not a string.
    expect(parseErrors({}).username).toBeDefined();
  });
});
