import { describe, expect, it } from 'vite-plus/test';

import { DEFAULT_MIN_COLUMN_WIDTH } from '../Table.constants';
import { resolveStaticColumnWidths } from './resolveStaticColumnWidths.util';

describe('resolveStaticColumnWidths', () => {
  it('leaves an undeclared column to size to its content', () => {
    expect(resolveStaticColumnWidths({})).toStrictEqual({
      maxWidth: undefined,
      minWidth: undefined,
      width: undefined,
    });
  });

  it('keeps the declared bounds and numeric width', () => {
    expect(
      resolveStaticColumnWidths({ maxWidth: 300, minWidth: 40, width: 120 }),
    ).toStrictEqual({ maxWidth: 300, minWidth: 40, width: 120 });
  });

  it('gives a fill column the whole width the others leave', () => {
    expect(resolveStaticColumnWidths({ width: 'fill' }).width).toBe('100%');
  });

  it('prefers a stored size over the declared width', () => {
    expect(
      resolveStaticColumnWidths({ sizedWidth: 180, width: 'fill' }).width,
    ).toBe(180);
    expect(
      resolveStaticColumnWidths({ sizedWidth: 90, width: 120 }).width,
    ).toBe(90);
  });

  it('fixes a pinned column at the width its sticky offsets are computed from', () => {
    expect(resolveStaticColumnWidths({ isPinned: true })).toStrictEqual({
      maxWidth: DEFAULT_MIN_COLUMN_WIDTH,
      minWidth: DEFAULT_MIN_COLUMN_WIDTH,
      width: DEFAULT_MIN_COLUMN_WIDTH,
    });
    expect(
      resolveStaticColumnWidths({ isPinned: true, minWidth: 90, width: 'fill' })
        .width,
    ).toBe(90);
    expect(
      resolveStaticColumnWidths({ isPinned: true, sizedWidth: 150, width: 120 })
        .width,
    ).toBe(150);
  });
});
