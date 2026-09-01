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
import { TableWrapperContext } from '#ui/components/Table/contexts/TableWrapper/TableWrapperContext.context';
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
  (_unused, index) => {
    const isGrandTotal = index === GROUP_COUNT - 1;
    const isSubtotal = isGrandTotal || index % 4 === 3;

    return {
      [TABLE_GROUP_ROW_FIELD]: {
        aggregates: [],
        count: index + 1,
        isSubtotal,
        path: isGrandTotal
          ? []
          : [
              {
                columnKey: 'order_status',
                label: `Group ${index}`,
                value: `Group ${index}`,
              },
            ],
      },
    };
  },
);

const SMALL_ROWS: readonly TestRow[] = [
  {
    [TABLE_GROUP_ROW_FIELD]: {
      aggregates: [],
      count: 4,
      isSubtotal: false,
      path: [{ columnKey: 'order_status', label: 'Shipped', value: 'Shipped' }],
    },
  },
  {
    [TABLE_GROUP_ROW_FIELD]: {
      aggregates: [],
      count: 4,
      isSubtotal: true,
      path: [{ columnKey: 'order_status', label: 'Shipped', value: 'Shipped' }],
    },
  },
  {
    [TABLE_GROUP_ROW_FIELD]: {
      aggregates: [],
      count: 9,
      isSubtotal: true,
      path: [],
    },
  },
];

type HarnessProps = {
  readonly data: readonly TestRow[];
};

const BodyHarness = ({ data }: HarnessProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

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
            data,
            isLoading: false,
            isLoadingMore: false,
            totalRows: data.length,
          }}
        >
          <TableWrapperContext value={{ containerRef, wrapperRef }}>
            <div ref={containerRef}>
              <table>
                <TableBody tableContainerRef={containerRef} />
              </table>
            </div>
          </TableWrapperContext>
        </TableDataProvider>
      </TableFocusProvider>
    </TableConfigProvider>
  );
};

const Harness = () => <BodyHarness data={groupRows} />;
const SmallHarness = () => <BodyHarness data={SMALL_ROWS} />;

const readPixelValue = (element: Element) => {
  const match = /(\d+)px/.exec(element.getAttribute('style') ?? '');

  return match?.[1] === undefined ? 0 : Number(match[1]);
};

describe('TableBody under grouping', () => {
  afterEach(cleanup);

  it('keeps offsetY + rendered rows + bottom spacer equal to the body height', () => {
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

  it('gives every kind of group row the same declared height', () => {
    render(<SmallHarness />);

    const kinds = screen.getAllByTestId('table-group-header-row');

    expect(kinds).toHaveLength(SMALL_ROWS.length);

    for (const row of kinds) {
      expect(readPixelValue(row)).toBe(ROW_HEIGHT);
    }
  });
});
