import { describe, expect, it } from 'vite-plus/test';

import { readNewRoleFormValues } from './readNewRoleFormValues.util';

describe('readNewRoleFormValues', () => {
  it('reads every posted field', () => {
    const formData = new FormData();
    formData.set('description', 'Ships releases');
    formData.set('roleName', 'release-manager');
    formData.append('permissionIds', 'b3f1c2d4-0000-4000-8000-000000000001');

    expect(readNewRoleFormValues({ formData })).toEqual({
      description: 'Ships releases',
      permissionIds: ['b3f1c2d4-0000-4000-8000-000000000001'],
      roleName: 'release-manager',
    });
  });

  it('falls back to empty strings so the schema reports field errors, not type errors', () => {
    expect(readNewRoleFormValues({ formData: new FormData() })).toEqual({
      description: '',
      permissionIds: [],
      roleName: '',
    });
  });
});
