import { describe, expect, it } from 'vite-plus/test';

import { missingPathError } from './missingPathError.util.ts';

describe('missingPathError', () => {
  it('builds the ENOENT error Node throws for the path', () => {
    expect(missingPathError('/absent')).toMatchObject({
      code: 'ENOENT',
      message: 'ENOENT: no such file or directory, /absent',
    });
  });
});
