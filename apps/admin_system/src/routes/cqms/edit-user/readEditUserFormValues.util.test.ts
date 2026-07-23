import { describe, expect, it } from 'vite-plus/test';

import { readEditUserFormValues } from './readEditUserFormValues.util';

describe('readEditUserFormValues', () => {
  it('reads every posted field', () => {
    const formData = new FormData();
    formData.set('displayName', 'Ada Lovelace');
    formData.set('isEnabled', 'on');
    formData.set('newPassword', 'analytical-engine');
    formData.append('roleIds', 'b3f1c2d4-0000-4000-8000-000000000001');

    expect(readEditUserFormValues({ formData })).toEqual({
      displayName: 'Ada Lovelace',
      isEnabled: true,
      newPassword: 'analytical-engine',
      roleIds: ['b3f1c2d4-0000-4000-8000-000000000001'],
    });
  });

  it('reads an omitted newPassword as empty — the "keep the current one" signal', () => {
    const formData = new FormData();
    formData.set('displayName', 'Ada Lovelace');

    expect(readEditUserFormValues({ formData })).toEqual({
      displayName: 'Ada Lovelace',
      isEnabled: false,
      newPassword: '',
      roleIds: [],
    });
  });
});
