import { describe, expect, it } from 'vite-plus/test';

import { isTableDensity } from './isTableDensity.util';

describe('isTableDensity', () => {
  it.each(['dense', 'compact', 'comfortable', 'spacious'])(
    'accepts %s',
    (value) => {
      expect(isTableDensity(value)).toBe(true);
    },
  );

  it.each([undefined, {}, 32, 'tight', 'toString', ''])(
    'rejects %s',
    (value) => {
      expect(isTableDensity(value)).toBe(false);
    },
  );
});
