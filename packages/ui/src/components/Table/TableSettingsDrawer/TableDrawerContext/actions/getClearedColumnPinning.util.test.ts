import { describe, expect, it } from 'vite-plus/test';

import { getClearedColumnPinning } from './getClearedColumnPinning.util';

describe('getClearedColumnPinning', () => {
  it('unpins every column that is not static', () => {
    expect(
      getClearedColumnPinning({
        columnPinning: { left: ['id', 'name'], right: ['total'] },
        staticKeys: new Set<string>(),
      }),
    ).toEqual({ left: [], right: [] });
  });

  it('keeps a static column on the side it is applied on', () => {
    expect(
      getClearedColumnPinning({
        columnPinning: { left: ['id', 'select'], right: ['actions'] },
        staticKeys: new Set<string>(['actions', 'select']),
      }),
    ).toEqual({ left: ['select'], right: ['actions'] });
  });

  it('returns empty pinning when nothing is applied', () => {
    expect(getClearedColumnPinning(undefined)).toEqual({ left: [], right: [] });
  });
});
