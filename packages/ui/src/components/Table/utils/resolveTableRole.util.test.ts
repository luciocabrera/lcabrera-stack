import { describe, expect, it } from 'vite-plus/test';

import { resolveTableRole } from './resolveTableRole.util';

describe('resolveTableRole', () => {
  it('is a grid in the virtual layout, and a treegrid over a tree', () => {
    expect(resolveTableRole({ isTreeGrid: false, layout: 'virtual' })).toBe(
      'grid',
    );
    expect(resolveTableRole({ isTreeGrid: true, layout: 'virtual' })).toBe(
      'treegrid',
    );
  });

  it('is a table in the static layout, over a tree too', () => {
    expect(resolveTableRole({ isTreeGrid: false, layout: 'static' })).toBe(
      'table',
    );
    expect(resolveTableRole({ isTreeGrid: true, layout: 'static' })).toBe(
      'table',
    );
  });
});
