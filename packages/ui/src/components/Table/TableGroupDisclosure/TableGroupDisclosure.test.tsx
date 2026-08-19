// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { TableGroupKeyValue } from '#ui/components/Table/Table.types';

import { TableGroupDisclosure } from './TableGroupDisclosure.component';

const { toggleMock } = vi.hoisted(() => ({ toggleMock: vi.fn() }));

vi.mock('#ui/components/Table/contexts/TableConfig/expansion/actions', () => ({
  useToggleTableGroupExpansion: () => toggleMock,
}));

const PATH: readonly TableGroupKeyValue[] = [
  { columnKey: 'region', label: 'EMEA', value: 'EMEA' },
];

describe('TableGroupDisclosure', () => {
  afterEach(() => {
    cleanup();
    toggleMock.mockReset();
  });

  it('toggles the group it names when clicked', () => {
    render(
      <TableGroupDisclosure
        disclosure={{ hasChildren: true, isDrillable: false, isExpanded: true }}
        path={PATH}
      />,
    );

    fireEvent.click(screen.getByTestId('table-group-disclosure'));

    // Called with the path, not with a row index: expansion is keyed by group
    // path so it survives a sort that reorders every row (ADR-061).
    expect(toggleMock).toHaveBeenCalledWith(PATH);
  });

  it('states its direction from the row’s expansion', () => {
    const { rerender } = render(
      <TableGroupDisclosure
        disclosure={{ hasChildren: true, isDrillable: false, isExpanded: true }}
        path={PATH}
      />,
    );

    expect(screen.getByTestId('table-group-disclosure').dataset.expanded).toBe(
      'true',
    );

    rerender(
      <TableGroupDisclosure
        disclosure={{
          hasChildren: true,
          isDrillable: false,
          isExpanded: false,
        }}
        path={PATH}
      />,
    );

    expect(screen.getByTestId('table-group-disclosure').dataset.expanded).toBe(
      'false',
    );
  });

  it('renders no control on a row with nothing to open', () => {
    render(
      <TableGroupDisclosure
        disclosure={{
          hasChildren: false,
          isDrillable: false,
          isExpanded: false,
        }}
        path={PATH}
      />,
    );

    expect(screen.queryByTestId('table-group-disclosure')).toBeNull();
  });

  it('renders no control on a row that is not in a tree at all', () => {
    render(<TableGroupDisclosure disclosure={undefined} path={PATH} />);

    expect(screen.queryByTestId('table-group-disclosure')).toBeNull();
  });

  it('stays out of the tab order and out of the accessibility tree', () => {
    // The constraint this component exists to respect. ADR-062 gives the grid
    // one roving tab stop addressed by row key plus column key; a <button>
    // here would add a second one inside a cell that already owns one. The row
    // carries `aria-expanded`, so announcing this too would state the same
    // thing twice.
    render(
      <TableGroupDisclosure
        disclosure={{
          hasChildren: true,
          isDrillable: false,
          isExpanded: false,
        }}
        path={PATH}
      />,
    );

    const control = screen.getByTestId('table-group-disclosure');

    expect(control.tagName).not.toBe('BUTTON');
    expect(control.getAttribute('tabindex')).toBeNull();
    expect(control.getAttribute('aria-hidden')).toBe('true');
    expect(control.getAttribute('aria-expanded')).toBeNull();
  });
});
