import { describe, expect, it } from 'vitest';

import { newRoleSchema } from './newRole.schema';
import { toNewRoleFieldErrors } from './toNewRoleFieldErrors.util';

const validValues = {
  description: '',
  permissionIds: [],
  roleName: 'release-manager',
};

const parseErrors = (values: Readonly<Record<string, unknown>>) => {
  const parsed = newRoleSchema.safeParse(values);
  if (parsed.success) {
    throw new Error('Expected the fixture to fail validation.');
  }
  return toNewRoleFieldErrors({ error: parsed.error });
};

describe('toNewRoleFieldErrors', () => {
  it('surfaces an invalid role name', () => {
    expect(
      parseErrors({ ...validValues, roleName: 'Release Manager' }),
    ).toEqual({
      permissionIds: undefined,
      roleName: 'Lowercase kebab-case, 2-64 chars (e.g. release-manager).',
    });
  });

  it('surfaces a non-uuid permission id', () => {
    expect(
      parseErrors({ ...validValues, permissionIds: ['nope'] }).permissionIds,
    ).toBeDefined();
  });

  it('accepts any description — the field cannot fail validation', () => {
    const parsed = newRoleSchema.safeParse({
      ...validValues,
      description: 'anything at all',
    });

    expect(parsed.success).toBe(true);
  });
});
