import { describe, expect, it } from 'vite-plus/test';

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
});
