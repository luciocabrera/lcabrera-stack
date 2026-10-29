import { describe, expect, it } from 'vite-plus/test';

import { selectTableResponse } from './selectTableResponse.util';

type Page = {
  readonly error?: { readonly kind: 'unexpected'; readonly message: string };
  readonly rows: readonly Row[];
  readonly total?: number;
};

type Row = { readonly id: number };

describe('selectTableResponse', () => {
  it('reads rows, total and error through the selectors', () => {
    const error = { kind: 'unexpected', message: 'boom' } as const;

    expect(
      selectTableResponse<Row, Page>({
        dataErrorSelector: (page) => page.error,
        dataSelector: (page) => page.rows,
        dataTotalSelector: (page) => page.total,
        response: { error, rows: [{ id: 1 }], total: 40 },
      }),
    ).toStrictEqual({ data: [{ id: 1 }], error, totalRows: 40 });
  });

  it('counts the selected rows when there is no total', () => {
    expect(
      selectTableResponse<Row, Page>({
        dataSelector: (page) => page.rows,
        response: { rows: [{ id: 1 }, { id: 2 }] },
      }),
    ).toStrictEqual({
      data: [{ id: 1 }, { id: 2 }],
      error: undefined,
      totalRows: 2,
    });
  });

  it('takes an array given with no data selector as the rows', () => {
    const rows: readonly Row[] = [{ id: 1 }, { id: 2 }];

    expect(selectTableResponse<Row, Page>({ response: rows })).toStrictEqual({
      data: rows,
      error: undefined,
      totalRows: 2,
    });
  });

  it('selects no rows from a non-array response with no data selector', () => {
    expect(
      selectTableResponse<Row, Page>({ response: { rows: [] } }),
    ).toStrictEqual({ data: [], error: undefined, totalRows: 0 });
  });
});
