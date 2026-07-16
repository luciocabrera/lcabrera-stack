import { describe, expect, it } from 'vitest';

import { editRoleSchema } from './editRole.schema';
import { toEditRoleFieldErrors } from './toEditRoleFieldErrors.util';

const validValues = {
  description: '',
  isEnabled: true,
  permissionIds: [],
};

const parseErrors = (values: Readonly<Record<string, unknown>>) => {
  const parsed = editRoleSchema.safeParse(values);
  if (parsed.success) {
    throw new Error('Expected the fixture to fail validation.');
  }
  return toEditRoleFieldErrors({ error: parsed.error });
};

describe('toEditRoleFieldErrors', () => {
  it('surfaces a non-uuid permission id', () => {
    expect(parseErrors({ ...validValues, permissionIds: ['nope'] })).toEqual({
      description: undefined,
      permissionIds: expect.any(String),
    });
  });

  it('surfaces a missing isEnabled as a validation failure', () => {
    // isEnabled is a required boolean — readEditRoleFormValues always supplies
    // it, so a failure here means the two have drifted apart.
    expect(parseErrors({ description: '', permissionIds: [] })).toBeDefined();
  });
});
