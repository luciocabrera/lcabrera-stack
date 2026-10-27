import { describe, expect, it } from 'vite-plus/test';

import { toColumnName } from './to-column-name.util.ts';

describe('toColumnName', () => {
  it('names a base column by itself and a joined one as alias.column', () => {
    expect(toColumnName('id')).toBe('id');
    expect(toColumnName({ column: 'name', source: 'vendor' })).toBe(
      'vendor.name',
    );
  });
});
