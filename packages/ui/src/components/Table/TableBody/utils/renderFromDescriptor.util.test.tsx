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
    renderCell(customDescriptor({ children: <span>custom</span> }));

    expect(screen.getByRole('gridcell').textContent).toBe('custom');
  });

  it('forwards the descriptor’s sizing to the cell', () => {
    renderCell(defaultDescriptor('x'));

    expect(screen.getByRole('gridcell').getAttribute('style')).toContain(
      '--x-width: 120px',
    );
  });

  it('forwards a custom descriptor’s dataType so the cell can align by it', () => {
    renderCell(
      customDescriptor({ children: <span>4,200</span>, dataType: 'currency' }),
    );

    const applied = classesOnCell();

    expect(alignRightClasses().every((cls) => applied.has(cls))).toBe(true);
  });

  it('leaves a custom descriptor without a dataType unaligned', () => {
    renderCell(customDescriptor({ children: <span>4,200</span> }));

    const applied = classesOnCell();

    expect(alignRightClasses().some((cls) => applied.has(cls))).toBe(false);
  });

  it('renders an empty default value without throwing', () => {
    renderCell(defaultDescriptor(''));

    expect(screen.getByRole('gridcell').tagName).toBe('TD');
  });
});
