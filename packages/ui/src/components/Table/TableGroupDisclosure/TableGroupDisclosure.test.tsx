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
        disclosure={{
          hasChildren: true,
          isExpanded: true,
          levelDisclosures: [],
        }}
        path={PATH}
      />,
    );

    fireEvent.click(screen.getByTestId('table-group-disclosure'));

    expect(toggleMock).toHaveBeenCalledWith(PATH);
  });

  it('states its direction from the row’s expansion', () => {
    const { rerender } = render(
      <TableGroupDisclosure
        disclosure={{
          hasChildren: true,
          isExpanded: true,
          levelDisclosures: [],
        }}
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
          isExpanded: false,
          levelDisclosures: [],
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
          isExpanded: false,
          levelDisclosures: [],
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
    render(
      <TableGroupDisclosure
        disclosure={{
          hasChildren: true,
          isExpanded: false,
          levelDisclosures: [],
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
