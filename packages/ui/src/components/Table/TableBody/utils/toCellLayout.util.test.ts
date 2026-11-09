import { describe, expect, it } from 'vite-plus/test';

import { toCellLayout } from './toCellLayout.util';

describe('toCellLayout', () => {
  it('picks the layout fields out of a wider descriptor', () => {
    const staticWidths = { maxWidth: undefined, minWidth: 40, width: 120 };
    const descriptor = {
      align: 'end',
      columnKey: 'name',
      isFill: true,
      isNumeric: true,
      staticWidths,
    } as const;

    expect(toCellLayout(descriptor)).toStrictEqual({
      align: 'end',
      isFill: true,
      isNumeric: true,
      staticWidths,
    });
  });

  it('leaves each field unset when the descriptor sets none', () => {
    expect(toCellLayout({})).toStrictEqual({
      align: undefined,
      isFill: undefined,
      isNumeric: undefined,
      staticWidths: undefined,
    });
  });
});
