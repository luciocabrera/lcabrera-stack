// @vitest-environment jsdom

import type { ComponentProps } from 'react';

import { cleanup, render, screen } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

import { spacing, typography } from '#ui/design-system/tokens/base.stylex';

import { TableBase } from './TableBase.component';

const {
  useGetTableDensityMock,
  useGetTableHeaderDensityMock,
  useGetTableIsBorderedMock,
  useGetTableIsLoadingMock,
  useGetTableIsStripedMock,
  useGetTableTotalRowsMock,
  useSyncTableGroupExpansionMock,
  useTableGridFocusMock,
  useTableGroupTreeMock,
} = vi.hoisted(() => ({
  useGetTableDensityMock: vi.fn(),
  useGetTableHeaderDensityMock: vi.fn(),
  useGetTableIsBorderedMock: vi.fn(),
  useGetTableIsLoadingMock: vi.fn(),
  useGetTableIsStripedMock: vi.fn(),
  useGetTableTotalRowsMock: vi.fn(),
  useSyncTableGroupExpansionMock: vi.fn(),
  useTableGridFocusMock: vi.fn(),
  useTableGroupTreeMock: vi.fn(),
}));

vi.mock('../contexts/TableConfig/meta/selectors', () => ({
  useGetTableDensity: useGetTableDensityMock,
  useGetTableHeaderDensity: useGetTableHeaderDensityMock,
  useGetTableIsBordered: useGetTableIsBorderedMock,
  useGetTableIsStriped: useGetTableIsStripedMock,
}));

vi.mock('../contexts/TableData/data/selectors', () => ({
  useGetTableIsLoading: useGetTableIsLoadingMock,
  useGetTableTotalRows: useGetTableTotalRowsMock,
}));

// The focus wiring is exercised end to end in Table.gridFocus.test.tsx, against
// a real provider stack and a real virtualization window. Stubbing it here keeps
// this suite about the element TableBase renders.
vi.mock('#ui/components/Table/hooks', () => ({
  useSyncTableGroupExpansion: useSyncTableGroupExpansionMock,
  useTableGridFocus: useTableGridFocusMock,
  useTableGroupTree: useTableGroupTreeMock,
}));

afterEach(() => {
  cleanup();
});

type RenderTableBaseArgs = {
  readonly cellText?: string;
  readonly props?: ComponentProps<typeof TableBase>;
};

const renderTableBase = ({
  cellText = 'Orders',
  props = {},
}: RenderTableBaseArgs = {}) =>
  render(
    <TableBase {...props}>
      <tbody>
        <tr>
          <td>{cellText}</td>
        </tr>
      </tbody>
    </TableBase>,
  );

describe('TableBase', () => {
  beforeEach(() => {
    useGetTableDensityMock.mockReturnValue('comfortable');
    useGetTableHeaderDensityMock.mockReturnValue('comfortable');
    useGetTableIsBorderedMock.mockReturnValue(true);
    useGetTableIsStripedMock.mockReturnValue(false);
    useGetTableIsLoadingMock.mockReturnValue(false);
    useGetTableTotalRowsMock.mockReturnValue(0);
    useTableGridFocusMock.mockReturnValue({ tabIndex: 0 });
    useTableGroupTreeMock.mockReturnValue({
      isTreeGrid: false,
      rowMeta: undefined,
      rows: [],
    });
  });

  it('renders children inside a table element', () => {
    renderTableBase();

    const table = screen.getByTestId('table');
    expect(table.tagName).toBe('TABLE');
    expect(screen.getByText('Orders').textContent).toBe('Orders');
  });

  it('reflects striped state via data attribute', () => {
    useGetTableIsStripedMock.mockReturnValue(true);

    renderTableBase({ cellText: 'Striped' });

    const table = screen.getByTestId('table');
    expect(table.dataset.striped).toBe('true');
  });

  it('declares role=grid, because the display overrides removed the implicit one', () => {
    renderTableBase();

    expect(screen.getByRole('grid')).toBe(screen.getByTestId('table'));
  });

  it('reports aria-rowcount as the dataset plus its header row', () => {
    useGetTableTotalRowsMock.mockReturnValue(120);

    renderTableBase();

    expect(screen.getByRole('grid').getAttribute('aria-rowcount')).toBe('121');
  });

  it('reports a resolved empty grid as holding exactly its header row', () => {
    useGetTableTotalRowsMock.mockReturnValue(0);
    useGetTableIsLoadingMock.mockReturnValue(false);

    renderTableBase();

    expect(screen.getByRole('grid').getAttribute('aria-rowcount')).toBe('1');
  });

  it('reports an unknown aria-rowcount only while the data has not resolved', () => {
    useGetTableTotalRowsMock.mockReturnValue(0);
    useGetTableIsLoadingMock.mockReturnValue(true);

    renderTableBase();

    expect(screen.getByRole('grid').getAttribute('aria-rowcount')).toBe('-1');
  });

  it('keeps its ARIA contract when a caller passes conflicting props', () => {
    useGetTableTotalRowsMock.mockReturnValue(120);

    renderTableBase({ props: { 'aria-rowcount': 7, role: 'table' } });

    const grid = screen.getByTestId('table');
    expect(grid.getAttribute('role')).toBe('grid');
    expect(grid.getAttribute('aria-rowcount')).toBe('121');
  });

  it('upgrades to role=treegrid, and counts the rows a collapse leaves standing', () => {
    useGetTableTotalRowsMock.mockReturnValue(120);
    useTableGroupTreeMock.mockReturnValue({
      isTreeGrid: true,
      rowMeta: [],
      rows: [{}, {}, {}],
    });

    renderTableBase();

    const grid = screen.getByTestId('table');
    expect(grid.getAttribute('role')).toBe('treegrid');
    expect(grid.getAttribute('aria-rowcount')).toBe('4');
  });

  it('forwards native table attributes', () => {
    renderTableBase({ cellText: 'Summary', props: { title: 'orders-table' } });

    const table = screen.getByTitle('orders-table');
    expect(table.tagName).toBe('TABLE');
  });

  it('sets the body variables from the density and the header variables from the header density', () => {
    useGetTableDensityMock.mockReturnValue('dense');
    useGetTableHeaderDensityMock.mockReturnValue('spacious');

    renderTableBase();

    const { style } = screen.getByTestId('table');
    expect(style.getPropertyValue('--x---table-body-font-size').trim()).toBe(
      typography.fontSizeXs,
    );
    expect(
      style.getPropertyValue('--x---table-body-padding-inline').trim(),
    ).toBe(spacing.xxs);
    expect(style.getPropertyValue('--x---table-header-font-size').trim()).toBe(
      typography.fontSizeSm,
    );
    expect(
      style.getPropertyValue('--x---table-header-padding-inline').trim(),
    ).toBe(spacing.md);
  });
});
