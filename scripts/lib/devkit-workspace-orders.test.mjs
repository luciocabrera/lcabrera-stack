import { describe, expect, test } from 'vite-plus/test';

import {
  COMPARED_ROWS,
  orderProbeFindings,
  renderedOrderIds,
  withSettings,
} from './devkit-workspace-orders.mjs';

const row = (cells) =>
  `<tr role="row" class="r">${cells
    .map(
      (cell) =>
        `<td role="gridcell"><div></div><span title="${cell}">${cell}</span></td>`,
    )
    .join('')}</tr>`;

const PLACEHOLDER = row(['', '']);

describe('renderedOrderIds', () => {
  test('reads the first cell of each data row, skipping the streamed placeholders', () => {
    const html = [
      '<table><tr role="row"><th role="columnheader">Order</th></tr>',
      PLACEHOLDER,
      PLACEHOLDER,
      '</table><div hidden id="S:0"><table>',
      row(['379', 'ORD-00000379']),
      row(['759', 'ORD-00000759']),
      '</table></div>',
    ].join('');

    expect(renderedOrderIds(html)).toEqual([379, 759]);
  });

  test('a page with no data rows reads as none', () => {
    expect(renderedOrderIds(`<html>${PLACEHOLDER}</html>`)).toEqual([]);
  });
});

describe('orderProbeFindings', () => {
  const baseline = Array.from(
    { length: COMPARED_ROWS },
    (_, index) => index + 1,
  );
  const sorted = [379, 759, 359, 12, 40, 41, 42, 43, 44, 45];
  const probe = {
    baseline,
    expected: sorted,
    key: 'sorted',
    url: 'http://127.0.0.1/?sorting=x',
    verb: 'sort',
  };

  test('passes a page whose rows start the way SQL orders them', () => {
    expect(orderProbeFindings({ ...probe, rendered: sorted })).toEqual([]);
  });

  test('fails a page that ignored the sort and shows the unsorted rows', () => {
    const [finding] = orderProbeFindings({ ...probe, rendered: baseline });

    expect(finding).toContain('rendered order_id 1, 2, 3');
    expect(finding).toContain('gives 379, 759, 359');
    expect(finding).toContain('did not sort');
  });

  test('fails a page that rendered no rows', () => {
    expect(orderProbeFindings({ ...probe, rendered: [] })[0]).toContain(
      'rendered no order rows',
    );
  });

  test('refuses to pass when SQL itself cannot tell the request from the baseline', () => {
    expect(
      orderProbeFindings({
        ...probe,
        expected: baseline,
        rendered: baseline,
      })[0],
    ).toContain('cannot show whether the route did sort');
  });

  test('passes a filtered page that shows only matching rows, in their order', () => {
    expect(
      orderProbeFindings({
        ...probe,
        expected: [3, 7, 9, 15, 22, 30, 31, 32, 50, 51, 60],
        key: 'filtered',
        rendered: [3, 7, 9, 15, 22, 30, 31, 32, 50, 51],
      }),
    ).toEqual([]);
  });

  test('fails a filtered page whose first ten rows match and whose eleventh does not', () => {
    const matching = [3, 7, 9, 15, 22, 30, 31, 32, 50, 51, 60, 61];
    const [finding] = orderProbeFindings({
      ...probe,
      expected: matching,
      key: 'filtered',
      rendered: [...matching.slice(0, 10), 52],
    });

    expect(finding).toContain('at rows 2–11');
    expect(finding).toContain('did not sort');
  });

  test('fails a filtered page that shows a row the filter excludes', () => {
    expect(
      orderProbeFindings({
        ...probe,
        expected: [3, 7, 9, 15, 22, 30, 31, 32, 50, 51, 60],
        key: 'filtered',
        rendered: [3, 4, 7, 9, 15, 22, 30, 31, 32, 50],
      }),
    ).toHaveLength(1);
  });
});

describe('withSettings', () => {
  test('replaces a setting the file has and appends one it lacks', () => {
    expect(
      withSettings({
        file: '# template\nDB_HOST=localhost\nDB_PORT=5432\n',
        settings: { DB_NAME: 'tree', DB_PORT: '6000' },
      }),
    ).toBe('# template\nDB_HOST=localhost\nDB_PORT=6000\nDB_NAME=tree\n');
  });
});
