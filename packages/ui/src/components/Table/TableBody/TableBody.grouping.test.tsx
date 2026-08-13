// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import type { TableColumn } from '#ui/components/Table/Table.types';

import {
  TableConfigProvider,
  TableDataProvider,
  TableFocusProvider,
} from '#ui/components/Table/contexts';
import { TABLE_GROUP_ROW_FIELD } from '#ui/components/Table/Table.constants';

import { TableBody } from './TableBody.component';

type TestRow = Record<string, unknown>;

const ROW_HEIGHT = 40;
const OVERSCAN = 2;
const GROUP_COUNT = 60;

const columns: TableColumn<TestRow>[] = [
  { isPrimaryKey: true, key: 'order_id', label: 'Order ID' },
  { key: 'order_status', label: 'Status' },
];

const groupRows: readonly TestRow[] = Array.from(
  { length: GROUP_COUNT },
  (_unused, index) => ({
    [TABLE_GROUP_ROW_FIELD]: {
      aggregates: [],
      count: index + 1,
      isSubtotal: false,
      path: [{ columnKey: 'order_status', label: `Group ${index}` }],
    },
  }),
);

const Harness = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <TableConfigProvider<TestRow>
      columnsState={{ columns }}
      metaState={{
        groupingKeys: ['order_status'],
        overscan: OVERSCAN,
        rowHeight: ROW_HEIGHT,
      }}
    >
      <TableFocusProvider>
        <TableDataProvider<TestRow>
          dataState={{
            data: groupRows,
            isLoading: false,
            isLoadingMore: false,
            totalRows: GROUP_COUNT,
          }}
        >
          <div ref={containerRef}>
            <table>
              <TableBody tableContainerRef={containerRef} />
            </table>
          </div>
        </TableDataProvider>
      </TableFocusProvider>
    </TableConfigProvider>
  );
};

/**
 * StyleX resolves to atomic classes against a stylesheet jsdom never loads, so
 * dynamic values arrive as inline custom properties. Each element here declares
 * exactly one pixel-valued dynamic style — the body its total height, a spacer
 * its own — so reading the single `px` token off the attribute is unambiguous.
 */
const readPixelValue = (element: Element) => {
  const match = /(\d+)px/.exec(element.getAttribute('style') ?? '');

  return match?.[1] === undefined ? 0 : Number(match[1]);
};

describe('TableBody under grouping', () => {
  afterEach(cleanup);

  it('keeps offsetY + rendered rows + bottom spacer equal to the body height', () => {
    // The invariant recorded in TableRow/ARCHITECTURE.md, measured off a body
    // whose every row is a group row. It is worth measuring rather than
    // restating because grouping is the first feature to render a row through a
    // component other than the plain cell path: a group row that painted taller,
    // or that emitted a second <tr>, would break this sum while every unit test
    // around it still passed.
    render(<Harness />);

    const body = screen.getByTestId('table-body');
    const rows = [...body.querySelectorAll('tr')];
    const spacers = rows.filter(
      (row) => row.getAttribute('aria-hidden') === 'true',
    );
    const renderedRows = rows.length - spacers.length;

    const totalHeight = readPixelValue(body);
    const spacerHeight = spacers.reduce(
      (total, spacer) => total + readPixelValue(spacer),
      0,
    );

    expect(totalHeight).toBe(GROUP_COUNT * ROW_HEIGHT);
    expect(renderedRows).toBeGreaterThan(0);
    expect(renderedRows).toBeLessThan(GROUP_COUNT);
    expect(spacerHeight + renderedRows * ROW_HEIGHT).toBe(totalHeight);
  });

  it('renders every windowed row as a group header at the configured height', () => {
    render(<Harness />);

    const body = screen.getByTestId('table-body');
    const groupHeaders = screen.getAllByTestId('table-group-header-row');
    const renderedRows = [...body.querySelectorAll('tr')].filter(
      (row) => row.getAttribute('aria-hidden') !== 'true',
    );

    expect(groupHeaders).toHaveLength(renderedRows.length);

    for (const header of groupHeaders) {
      expect(readPixelValue(header)).toBe(ROW_HEIGHT);
    }
  });
});
