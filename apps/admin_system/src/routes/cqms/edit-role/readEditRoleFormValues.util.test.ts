import { describe, expect, it } from 'vite-plus/test';

import { readEditRoleFormValues } from './readEditRoleFormValues.util';

describe('readEditRoleFormValues', () => {
  it('reads every posted field', () => {
    const formData = new FormData();
    formData.set('description', 'Ships releases');
    formData.set('isEnabled', 'on');
    formData.append('permissionIds', 'b3f1c2d4-0000-4000-8000-000000000001');

    expect(readEditRoleFormValues({ formData })).toEqual({
      description: 'Ships releases',
      isEnabled: true,
      permissionIds: ['b3f1c2d4-0000-4000-8000-000000000001'],
    });
  });

  it('reads an unchecked isEnabled as false rather than missing', () => {
    // An unchecked checkbox posts nothing at all — absence IS the value.
    expect(readEditRoleFormValues({ formData: new FormData() })).toEqual({
      description: '',
      isEnabled: false,
      permissionIds: [],
    });
  });
});
