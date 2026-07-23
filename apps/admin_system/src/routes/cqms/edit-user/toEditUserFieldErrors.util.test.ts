import { describe, expect, it } from 'vite-plus/test';

import { editUserSchema } from './editUser.schema';
import { toEditUserFieldErrors } from './toEditUserFieldErrors.util';

const validValues = {
  displayName: 'Ada Lovelace',
  isEnabled: true,
  newPassword: '',
  roleIds: [],
};

const parseErrors = (values: Readonly<Record<string, unknown>>) => {
  const parsed = editUserSchema.safeParse(values);
  if (parsed.success) {
    throw new Error('Expected the fixture to fail validation.');
  }
  return toEditUserFieldErrors({ error: parsed.error });
};

describe('toEditUserFieldErrors', () => {
  it('surfaces a missing display name', () => {
    expect(parseErrors({ ...validValues, displayName: '' })).toEqual({
      displayName: 'Display name is required.',
      newPassword: undefined,
      roleIds: undefined,
    });
  });

  it('surfaces a too-short new password', () => {
    expect(
      parseErrors({ ...validValues, newPassword: 'short' }).newPassword,
    ).toBe(
      'Password must be at least 8 characters (leave empty to keep the current one).',
    );
  });

  it('treats an empty newPassword as valid — it means "keep the current one"', () => {
    const parsed = editUserSchema.safeParse({
      ...validValues,
      newPassword: '',
    });

    expect(parsed.success).toBe(true);
  });

  it('surfaces a non-uuid role id', () => {
    expect(
      parseErrors({ ...validValues, roleIds: ['not-a-uuid'] }).roleIds,
    ).toBeDefined();
  });
});
