import { describe, expect, it } from 'vitest';

import { newUserSchema } from './newUser.schema';
import { toNewUserFieldErrors } from './toNewUserFieldErrors.util';

const validValues = {
  displayName: 'Ada Lovelace',
  password: 'analytical-engine',
  roleIds: [],
  username: 'ada',
};

const parseErrors = (values: Readonly<Record<string, unknown>>) => {
  const parsed = newUserSchema.safeParse(values);
  if (parsed.success) {
    throw new Error('Expected the fixture to fail validation.');
  }
  return toNewUserFieldErrors({ error: parsed.error });
};

describe('toNewUserFieldErrors', () => {
  it('surfaces a missing display name', () => {
    expect(parseErrors({ ...validValues, displayName: '' })).toEqual({
      displayName: 'Display name is required.',
      password: undefined,
      roleIds: undefined,
      username: undefined,
    });
  });

  it('surfaces a too-short password', () => {
    expect(parseErrors({ ...validValues, password: 'short' }).password).toBe(
      'Password must be at least 8 characters.',
    );
  });

  it('surfaces an invalid username', () => {
    expect(
      parseErrors({ ...validValues, username: 'Ada Lovelace' }).username,
    ).toBe(
      'Lowercase alphanumeric (dots, dashes, underscores allowed), 2-64 chars.',
    );
  });

  it('surfaces a non-uuid role id', () => {
    expect(
      parseErrors({ ...validValues, roleIds: ['not-a-uuid'] }).roleIds,
    ).toBeDefined();
  });
});
