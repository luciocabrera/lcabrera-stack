import { describe, expect, it } from 'vite-plus/test';

import { hasDescription } from './hasDescription.util';

describe('hasDescription', () => {
  it.each([undefined, JSON.parse('null'), false, true, ''])(
    'omits %j',
    (description) => {
      expect(hasDescription(description)).toBe(false);
    },
  );

  it.each([0, 0n, -0, 'Text', ['a']])('keeps %s', (description) => {
    expect(hasDescription(description)).toBe(true);
  });
});
