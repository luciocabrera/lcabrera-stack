import { describe, expect, it } from 'vite-plus/test';

import { errorCode } from './errorCode.util.ts';

describe('errorCode', () => {
  it('reads a string code', () => {
    const denied = Object.assign(new Error('x'), { code: 'EACCES' });

    expect(errorCode(denied)).toBe('EACCES');
  });

  it.each([new Error('x'), { code: 7 }, 'EACCES', undefined])(
    'has none for %o',
    (error) => {
      expect(errorCode(error)).toBeUndefined();
    },
  );
});
