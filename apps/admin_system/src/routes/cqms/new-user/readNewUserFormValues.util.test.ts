import { describe, expect, it } from 'vitest';

import { readNewUserFormValues } from './readNewUserFormValues.util';

describe('readNewUserFormValues', () => {
  it('reads every posted field', () => {
    const formData = new FormData();
    formData.set('displayName', 'Ada Lovelace');
    formData.set('password', 'analytical-engine');
    formData.set('username', 'ada');
    formData.append('roleIds', 'b3f1c2d4-0000-4000-8000-000000000001');
    formData.append('roleIds', 'b3f1c2d4-0000-4000-8000-000000000002');

    expect(readNewUserFormValues({ formData })).toEqual({
      displayName: 'Ada Lovelace',
      password: 'analytical-engine',
      roleIds: [
        'b3f1c2d4-0000-4000-8000-000000000001',
        'b3f1c2d4-0000-4000-8000-000000000002',
      ],
      username: 'ada',
    });
  });

  it('falls back to empty strings so the schema reports field errors, not type errors', () => {
    expect(readNewUserFormValues({ formData: new FormData() })).toEqual({
      displayName: '',
      password: '',
      roleIds: [],
      username: '',
    });
  });
});
