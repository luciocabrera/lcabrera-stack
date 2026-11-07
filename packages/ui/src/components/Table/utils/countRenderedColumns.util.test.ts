import { describe, expect, it } from 'vite-plus/test';

import { countRenderedColumns } from './countRenderedColumns.util';

const column = (key: string) => ({ key, label: key });

type Row = Record<string, unknown>;

describe('countRenderedColumns', () => {
  it('counts the pinned and the centre columns together', () => {
    expect(
      countRenderedColumns<Row>({
        centerCols: [column('b'), column('c')],
        leftPinnedCols: [column('a')],
        rightPinnedCols: [column('d'), column('e')],
      }),
    ).toBe(5);
  });
});
