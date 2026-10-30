import { describe, expect, it } from 'vite-plus/test';

import { resolveTableSemantics } from './resolveTableSemantics.util';

const FOCUS = { onFocus: 'focus', tabIndex: 0 };

describe('resolveTableSemantics', () => {
  it('gives a static table its role and nothing a grid carries', () => {
    expect(
      resolveTableSemantics({
        gridFocusProps: FOCUS,
        isLoading: false,
        isTreeGrid: true,
        layout: 'static',
        totalRows: 4,
      }),
    ).toStrictEqual({ role: 'table' });
  });

  it('gives a virtual grid its focus props and a row count that counts the header', () => {
    expect(
      resolveTableSemantics({
        gridFocusProps: FOCUS,
        isLoading: false,
        isTreeGrid: false,
        layout: 'virtual',
        totalRows: 4,
      }),
    ).toStrictEqual({ ...FOCUS, 'aria-rowcount': 5, role: 'grid' });
  });
});
