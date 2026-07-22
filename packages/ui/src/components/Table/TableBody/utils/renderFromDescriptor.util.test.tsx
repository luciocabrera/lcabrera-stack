// @vitest-environment jsdom

import type { ReactNode } from 'react';

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import type { TableBodyCellDescriptor } from './buildTableBodyCellDescriptor.util';

import { renderFromDescriptor } from './renderFromDescriptor.util';

type Row = Record<string, unknown>;

const shared = {
  isLoadingState: false,
  key: 'name' as const,
  minWidth: 80,
  pinInfo: undefined,
  width: 120,
};

const customDescriptor = (children: ReactNode): TableBodyCellDescriptor<Row> =>
  ({ ...shared, children, kind: 'custom', label: '' }) as const;

const defaultDescriptor = (value: unknown): TableBodyCellDescriptor<Row> =>
  ({
    ...shared,
    dataType: 'string',
    format: undefined,
    kind: 'default',
    label: 'Name',
    value,
  }) as const;

/** A cell renders a `td`, which is only valid inside a row. */
const renderCell = (descriptor: TableBodyCellDescriptor<Row>) =>
  render(
    <table>
      <tbody>
        <tr>{renderFromDescriptor({ descriptor })}</tr>
      </tbody>
    </table>,
  );

afterEach(cleanup);

describe('renderFromDescriptor', () => {
  it('renders a custom descriptor’s children verbatim', () => {
    renderCell(customDescriptor(<button type='button'>Actions</button>));

    expect(screen.getByRole('button').textContent).toBe('Actions');
  });

  it('renders a default descriptor’s value', () => {
    renderCell(defaultDescriptor('Ada Lovelace'));

    expect(screen.getByRole('cell').textContent).toBe('Ada Lovelace');
  });

  it('renders each branch as a single td', () => {
    // The branches pass disjoint props — `children` on one, `value` on the
    // other — so the cell must not end up rendering both.
    renderCell(customDescriptor(<span>custom</span>));

    expect(screen.getByRole('cell').textContent).toBe('custom');
  });

  it('forwards the descriptor’s sizing to the cell', () => {
    // Guards the props object itself: a field dropped from either branch is
    // invisible in the text content but changes the rendered cell.
    renderCell(defaultDescriptor('x'));

    expect(screen.getByRole('cell').getAttribute('style')).toContain(
      '--x-width: 120px',
    );
  });

  it('renders an empty default value without throwing', () => {
    renderCell(defaultDescriptor(''));

    expect(screen.getByRole('cell').tagName).toBe('TD');
  });
});
