import { describe, expect, it } from 'vite-plus/test';

import { resolveCellLayout } from './resolveCellLayout.util';

const PIN = {
  isFirstPinnedRight: false,
  isLastPinnedLeft: true,
  offset: 0,
  side: 'left',
} as const;

describe('resolveCellLayout', () => {
  it('adds nothing for a plain column in the virtual layout', () => {
    expect(resolveCellLayout({ col: {}, isSized: false })).toStrictEqual({
      align: undefined,
      isFill: undefined,
      staticWidths: undefined,
    });
  });

  it('carries the declared alignment in both layouts', () => {
    expect(
      resolveCellLayout({ col: { align: 'end' }, isSized: false }).align,
    ).toBe('end');
    expect(
      resolveCellLayout({
        col: { align: 'center' },
        isSized: false,
        layout: 'static',
      }).align,
    ).toBe('center');
  });

  it('grows a fill column only while it is unsized and unpinned', () => {
    const fill = { width: 'fill' } as const;

    expect(resolveCellLayout({ col: fill, isSized: false }).isFill).toBe(true);
    expect(
      resolveCellLayout({ col: fill, isSized: true }).isFill,
    ).toBeUndefined();
    expect(
      resolveCellLayout({ col: fill, isSized: false, pinInfo: PIN }).isFill,
    ).toBeUndefined();
  });

  it('gives a static cell its declared widths and never the flex growth', () => {
    expect(
      resolveCellLayout({
        col: { minWidth: 40, width: 'fill' },
        isSized: false,
        layout: 'static',
      }),
    ).toStrictEqual({
      align: undefined,
      isFill: undefined,
      staticWidths: { maxWidth: undefined, minWidth: 40, width: '100%' },
    });
  });
});
