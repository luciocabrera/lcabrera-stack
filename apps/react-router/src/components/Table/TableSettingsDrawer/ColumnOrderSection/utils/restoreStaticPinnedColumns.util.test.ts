import { describe, expect, it } from 'vitest';

import { restoreStaticPinnedColumns } from './restoreStaticPinnedColumns.util';

describe('restoreStaticPinnedColumns', () => {
  it('returns original pinning when there are no static keys', () => {
    const pinning = { left: ['id'], right: ['actions'] };

    expect(
      restoreStaticPinnedColumns<Record<string, unknown>>({
        defaultPinning: { left: [], right: [] },
        finalPinning: pinning,
        staticKeys: new Set<string>(),
      }),
    ).toEqual(pinning);
  });

  it('restores missing static keys to their default pin side', () => {
    const result = restoreStaticPinnedColumns<Record<string, unknown>>({
      defaultPinning: { left: ['id'], right: ['actions'] },
      finalPinning: { left: [], right: [] },
      staticKeys: new Set(['actions', 'id']),
    });

    expect(result).toEqual({ left: ['id'], right: ['actions'] });
  });

  it('does not duplicate static keys already present in final pinning', () => {
    const result = restoreStaticPinnedColumns<Record<string, unknown>>({
      defaultPinning: { left: ['id'], right: ['actions'] },
      finalPinning: { left: ['id'], right: ['actions'] },
      staticKeys: new Set(['actions', 'id']),
    });

    expect(result).toEqual({ left: ['id'], right: ['actions'] });
  });
});
