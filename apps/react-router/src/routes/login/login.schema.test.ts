import { describe, expect, it } from 'vite-plus/test';

import { loginSchema } from './login.schema';

describe('loginSchema', () => {
  it('accepts a valid email and password', () => {
    const result = loginSchema.safeParse({
      email: 'demo@example.com',
      password: 'demo-password-123',
    });

    expect(result.success).toBe(true);
  });

  it('rejects an email failing the pattern', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'demo-password-123',
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.email).toBeDefined();
  });

  it('rejects a password shorter than the minimum', () => {
    const result = loginSchema.safeParse({
      email: 'demo@example.com',
      password: 'short',
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.password).toBeDefined();
  });

  it('rejects empty fields', () => {
    const result = loginSchema.safeParse({ email: '', password: '' });

    expect(result.success).toBe(false);
  });
});
