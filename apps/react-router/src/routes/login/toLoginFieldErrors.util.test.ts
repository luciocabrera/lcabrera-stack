import { describe, expect, it } from 'vitest';

import { loginSchema } from './login.schema';
import { toLoginFieldErrors } from './toLoginFieldErrors.util';

describe('toLoginFieldErrors', () => {
  it('maps Zod field errors to per-field messages', () => {
    const result = loginSchema.safeParse({ email: 'bad', password: 'x' });
    if (result.success) {
      throw new Error('expected validation to fail');
    }

    const errors = toLoginFieldErrors({ error: result.error });

    expect(errors.email).toBeDefined();
    expect(errors.password).toBeDefined();
  });

  it('leaves valid fields undefined', () => {
    const result = loginSchema.safeParse({
      email: 'demo@example.com',
      password: 'x',
    });
    if (result.success) {
      throw new Error('expected validation to fail');
    }

    const errors = toLoginFieldErrors({ error: result.error });

    expect(errors.email).toBeUndefined();
    expect(errors.password).toBeDefined();
  });
});
