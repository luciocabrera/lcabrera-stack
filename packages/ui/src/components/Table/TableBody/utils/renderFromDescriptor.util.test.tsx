// @vitest-environment jsdom

import type { ReactNode } from 'react';

import * as stylex from '@stylexjs/stylex';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vite-plus/test';

import type { TableColumnDataType } from '#ui/components/Table/Table.types';

import { TableFocusProvider } from '#ui/components/Table/contexts/TableFocus';
import { tableBodyCellStyles } from '#ui/components/Table/TableBodyCell/TableBodyCell.stylex';

import type { TableBodyCellDescriptor } from './buildTableBodyCellDescriptor.util';

import { renderFromDescriptor } from './renderFromDescriptor.util';

type Row = Record<string, unknown>;

const shared = {
  columnKey: 'name',
  isLoadingState: false,
  key: 'name' as const,
  minWidth: 80,
  pinInfo: undefined,
  rowIndex: 0,
  rowKey: 'pk:[1]',
  width: 120,
};

type CustomDescriptorArgs = {
  readonly children: ReactNode;
  readonly dataType?: TableColumnDataType;
};

const customDescriptor = ({
  children,
  dataType,
}: CustomDescriptorArgs): TableBodyCellDescriptor<Row> =>
  ({ ...shared, children, dataType, kind: 'custom', label: '' }) as const;

/** The classes the cell's own right-alignment style compiles to, read at run time. */
const alignRightClasses = () =>
  (stylex.props(tableBodyCellStyles.alignRight).className ?? '').split(' ');

const classesOnCell = () =>
  new Set(screen.getByRole('gridcell').className.split(' '));

const defaultDescriptor = (value: unknown): TableBodyCellDescriptor<Row> =>
  ({
    ...shared,
    dataType: 'string',
    format: undefined,
    kind: 'default',
    label: 'Name',
    value,
  }) as const;

/**
 * A cell renders a `td`, which is only valid inside a row — and a grid cell,
 * which reads the grid's focus store.
 */
const renderCell = (descriptor: TableBodyCellDescriptor<Row>) =>
  render(
    <TableFocusProvider>
      <table>
        <tbody>
          <tr>{renderFromDescriptor({ descriptor })}</tr>
        </tbody>
      </table>
    </TableFocusProvider>,
  );

afterEach(cleanup);

describe('renderFromDescriptor', () => {
  it('renders a custom descriptor’s children verbatim', () => {
    renderCell(
      customDescriptor({ children: <button type='button'>Actions</button> }),
    );

    expect(screen.getByRole('button').textContent).toBe('Actions');
  });

  it('renders a default descriptor’s value', () => {
    renderCell(defaultDescriptor('Ada Lovelace'));

    expect(screen.getByRole('gridcell').textContent).toBe('Ada Lovelace');
  });

  it('renders each branch as a single td', () => {
    // The branches pass disjoint props — `children` on one, `value` on the
    // other — so the cell must not end up rendering both.
    renderCell(customDescriptor({ children: <span>custom</span> }));

    expect(screen.getByRole('gridcell').textContent).toBe('custom');
  });

  it('forwards the descriptor’s sizing to the cell', () => {
    // Guards the props object itself: a field dropped from either branch is
    // invisible in the text content but changes the rendered cell.
    renderCell(defaultDescriptor('x'));

    expect(screen.getByRole('gridcell').getAttribute('style')).toContain(
      '--x-width: 120px',
    );
  });

  it('forwards a custom descriptor’s dataType so the cell can align by it', () => {
    // The branch dropped `dataType` entirely until #1018, which is what left a group
    // row's currency total flush left in a column of right-aligned numbers.
    renderCell(
      customDescriptor({ children: <span>4,200</span>, dataType: 'currency' }),
    );

    const applied = classesOnCell();

    expect(alignRightClasses().every((cls) => applied.has(cls))).toBe(true);
  });

  it('leaves a custom descriptor without a dataType unaligned', () => {
    // The consumer-render case, and the control for the assertion above: same branch,
    // same children, and the only difference is the type the descriptor withheld.
    renderCell(customDescriptor({ children: <span>4,200</span> }));

    const applied = classesOnCell();

    expect(alignRightClasses().some((cls) => applied.has(cls))).toBe(false);
  });

  it('renders an empty default value without throwing', () => {
    renderCell(defaultDescriptor(''));

    expect(screen.getByRole('gridcell').tagName).toBe('TD');
  });
});
