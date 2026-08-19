// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { TableDrillRowMarker } from '#ui/components/Table/Table.types';

import { TableDrillRowCell } from './TableDrillRowCell.component';

const columnFiltersMock = { current: {} as Record<string, unknown> };

vi.mock('#ui/components/Table/contexts/TableConfig/columns/selectors', () => ({
  useGetColumnFilters: () => columnFiltersMock.current,
  useGetColumns: () => [
    { dataType: 'text', key: 'region', label: 'Region' },
    { dataType: 'text', key: 'notes', label: 'Notes' },
  ],
}));

const markerOf = (
  overrides: Partial<TableDrillRowMarker> = {},
): TableDrillRowMarker => ({
  kind: 'handoff',
  path: [{ columnKey: 'region', label: 'Iberia', value: 'Iberia' }],
  pathKey: 'region:Iberia',
  shortfall: 214,
  ...overrides,
});

type RenderCellArgs = {
  readonly marker: TableDrillRowMarker;
  readonly search?: string;
};

const renderCell = ({ marker, search = '?grouping=region' }: RenderCellArgs) =>
  render(
    <RouterProvider
      router={createMemoryRouter(
        [{ element: <TableDrillRowCell marker={marker} />, path: '/orders' }],
        { initialEntries: [`/orders${search}`] },
      )}
    />,
  );

describe('TableDrillRowCell', () => {
  afterEach(() => {
    cleanup();
    columnFiltersMock.current = {};
  });

  it('says a page is in flight while it is', () => {
    renderCell({ marker: markerOf({ kind: 'loading' }) });

    expect(screen.getByTestId('table-drill-loading').textContent).toContain(
      'Loading',
    );
  });

  it('states a failure and names the gesture that retries it', () => {
    // `failed` is not terminal (ADR-079, amended), and nothing else on the row
    // says so — a reader who is not told assumes the group is simply empty.
    renderCell({ marker: markerOf({ kind: 'failed' }) });

    expect(screen.getByTestId('table-drill-failed').textContent).toContain(
      'reopen',
    );
  });

  it('names no cause for a failure', () => {
    // A refusal and a timeout differ to the server and not to the reader of one
    // group row.
    renderCell({ marker: markerOf({ kind: 'failed' }) });

    const text = screen.getByTestId('table-drill-failed').textContent ?? '';

    expect(text).not.toMatch(/timeout|refused|500|network/i);
  });

  it('offers the hand-off as a link to the ungrouped, filtered table', () => {
    renderCell({ marker: markerOf() });

    const link = screen.getByRole('link');

    expect(link.textContent).toBe('214 more rows');
    expect(link.getAttribute('href')).not.toContain('grouping=');
    expect(link.getAttribute('href')).toContain('filters=');
  });

  it('keeps the hand-off out of the tab order', () => {
    // ADR-062 gives the grid exactly one tab stop, addressed by row and column.
    // A tabbable anchor here would insert a second one inside a cell that
    // already owns it — the reason `TableGroupDisclosure` is not a button.
    renderCell({ marker: markerOf() });

    expect(screen.getByRole('link').getAttribute('tabindex')).toBe('-1');
  });

  it('still announces the hand-off, unlike the chevron', () => {
    // The chevron is `aria-hidden` because `aria-expanded` on the row already
    // states it. Nothing states this one, so it stays in the accessibility
    // tree and carries a name that says where it goes.
    renderCell({ marker: markerOf() });

    expect(screen.getByRole('link').getAttribute('aria-label')).toContain(
      'ungrouped',
    );
  });

  it('states the shortfall without a link when a key cannot be filtered', () => {
    // Navigating anyway would open a table showing the wrong rows under the
    // right heading.
    const nullKeyMarker = JSON.parse(
      '{"kind":"handoff","path":[{"columnKey":"region","label":"(empty)","value":null}],"pathKey":"region:","shortfall":9}',
    ) as TableDrillRowMarker;

    renderCell({ marker: nullKeyMarker });

    expect(screen.queryByRole('link')).toBeNull();
    expect(
      screen.getByTestId('table-drill-handoff-unavailable').textContent,
    ).toBe('9 more rows');
  });
});
