import { describe, expect, it } from 'vite-plus/test';

import { createForeignThenable } from './cellRenderers.fixtures';
import { isPromiseLike } from './isPromiseLike.util';

describe('isPromiseLike', () => {
  it('recognises a native promise', () => {
    expect(isPromiseLike(Promise.resolve(1))).toBe(true);
  });

  it('recognises a thenable that is not a native promise', () => {
    expect(isPromiseLike(createForeignThenable(() => undefined))).toBe(true);
  });

  it.each([[{ value: 1 }], [createForeignThenable(1)], ['then'], [undefined]])(
    'refuses %j',
    (value) => {
      expect(isPromiseLike(value)).toBe(false);
    },
  );
});
