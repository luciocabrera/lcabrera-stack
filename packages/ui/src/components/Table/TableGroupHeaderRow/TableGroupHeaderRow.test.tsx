// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import type { TableColumn } from '#ui/components/Table/Table.types';

import { TableConfigProvider } from '#ui/components/Table/contexts';
import { DEFAULT_ROW_HEIGHT } from '#ui/components/Table/Table.constants';
import { TableRow } from '#ui/components/Table/TableRow';

import { TableGroupHeaderRow } from './TableGroupHeaderRow.component';

type RenderGroupRowArgs = {
  readonly rowHeight?: number;
  readonly summary?: {
    readonly columnKey: string;
    readonly count: number;
    readonly label: string;
  };
};

type TestRow = {
  readonly order_id: number;
  readonly order_status: string;
};

const columns: TableColumn<TestRow>[] = [
  { isPrimaryKey: true, key: 'order_id', label: 'Order ID' },
  { key: 'order_status', label: 'Status' },
];

const defaultSummary = {
  columnKey: 'order_status',
  count: 12,
  label: 'Shipped',
};

/**
 * StyleX resolves to atomic classes against a stylesheet jsdom never loads, so
 * `getComputedStyle` reports `auto` here. Dynamic styles do reach the DOM as
 * inline custom properties, which is what the height assertions read.
 */
const getInlineStyle = (element: Element) =>
  element.getAttribute('style') ?? '';

const renderGroupRow = ({
  rowHeight,
  summary = defaultSummary,
}: RenderGroupRowArgs = {}) =>
  render(
    <TableConfigProvider<TestRow>
      columnsState={{ columns }}
      metaState={{ rowHeight }}
    >
      <table>
        <tbody>
          <TableGroupHeaderRow summary={summary} />
          <TableRow title='detail-row'>
            <td>detail</td>
          </TableRow>
        </tbody>
      </table>
    </TableConfigProvider>,
  );

describe('TableGroupHeaderRow', () => {
  afterEach(cleanup);

  it("names the grouped column by its label and shows the group's size", () => {
    renderGroupRow();

    expect(screen.getByText('Status: Shipped')).toBeTruthy();
    expect(screen.getByText('(12)')).toBeTruthy();
  });

  it('falls back to the column key when the table declares no such column', () => {
    renderGroupRow({
      summary: { columnKey: 'not_a_column', count: 1, label: 'x' },
    });

    expect(screen.getByText('not_a_column: x')).toBeTruthy();
  });

  it('paints at exactly the row height every other row paints at', () => {
    // The virtualization invariant, at its one load-bearing point: <tbody> is
    // sized totalLoadedRows x rowHeight and both spacers are derived from the
    // same number, so a group row of any other height desynchronizes the body
    // from its contents. Asserting it against a *detail* row rendered beside it
    // is what makes this a comparison rather than a restatement of the literal.
    renderGroupRow({ rowHeight: 48 });

    const groupRow = screen.getByTestId('table-group-header-row');
    const detailRow = screen.getByTitle('detail-row');

    expect(getInlineStyle(groupRow)).toContain('48px');
    expect(getInlineStyle(groupRow)).toBe(getInlineStyle(detailRow));
  });

  it('takes the default row height when the table configures none', () => {
    renderGroupRow();

    expect(
      getInlineStyle(screen.getByTestId('table-group-header-row')),
    ).toContain(`${DEFAULT_ROW_HEIGHT}px`);
  });

  it('occupies one row of the grid, spanning every rendered column', () => {
    renderGroupRow();

    const cells = screen
      .getByTestId('table-group-header-row')
      .querySelectorAll('td');

    expect(cells).toHaveLength(1);
    expect(cells[0]?.getAttribute('colspan')).toBe(String(columns.length));
  });
});
