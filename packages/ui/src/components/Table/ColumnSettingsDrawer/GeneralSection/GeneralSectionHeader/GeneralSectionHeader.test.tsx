// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vite-plus/test';

const { setColumnSizingMock, useGetNormalizedColumnMock } = vi.hoisted(() => ({
  setColumnSizingMock: vi.fn(),
  useGetNormalizedColumnMock: vi.fn(),
}));

vi.mock('#ui/components/SidePanel', () => ({
  SidePanelSection: ({ children }: { readonly children: React.ReactNode }) => (
    <section>{children}</section>
  ),
  SidePanelSectionHeader: ({ title }: { readonly title: string }) => (
    <h3>{title}</h3>
  ),
}));

vi.mock('#ui/components/Table/contexts/TableConfig/columns/selectors', () => ({
  useGetNormalizedColumn: () => useGetNormalizedColumnMock(),
}));

vi.mock(
  '#ui/components/Table/shared/ColumnWidthPresetButtons',
  async (importOriginal) => {
    const { MockColumnWidthPresetButtons } =
      await import('#ui/utils/tests/createMockColumnWidthPresetButtons.util');

    return {
      ...(await importOriginal<
        typeof import('#ui/components/Table/shared/ColumnWidthPresetButtons')
      >()),
      ColumnWidthPresetButtons: MockColumnWidthPresetButtons,
    };
  },
);

vi.mock('../../ColumnDrawerContext/actions', () => ({
  useSetDraftColumnSizing: () => setColumnSizingMock,
}));

import { GeneralSectionHeader } from './GeneralSectionHeader.component';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  setColumnSizingMock.mockReset();
  useGetNormalizedColumnMock.mockReset();
  useGetNormalizedColumnMock.mockReturnValue({
    key: 'name',
    label: 'Name',
    maxWidth: 240,
    minWidth: 80,
  });
});

describe('GeneralSectionHeader', () => {
  it('renders the section header', () => {
    render(<GeneralSectionHeader columnKey='name' />);

    expect(
      screen.getByRole('heading', { name: 'Column Width' }),
    ).not.toBeNull();
  });

  it('applies the column min width for the min preset', () => {
    render(<GeneralSectionHeader columnKey='name' />);

    fireEvent.click(screen.getByRole('button', { name: 'Min' }));

    expect(setColumnSizingMock).toHaveBeenCalledWith(80);
  });

  it('applies the column max width for the max preset', () => {
    render(<GeneralSectionHeader columnKey='name' />);

    fireEvent.click(screen.getByRole('button', { name: 'Max' }));

    expect(setColumnSizingMock).toHaveBeenCalledWith(240);
  });

  it('clears custom sizing for the default preset', () => {
    render(<GeneralSectionHeader columnKey='name' />);

    fireEvent.click(screen.getByRole('button', { name: 'Default' }));

    expect(setColumnSizingMock).toHaveBeenCalledWith(undefined);
  });

  it('deselects a toggled preset without writing sizing again', () => {
    render(<GeneralSectionHeader columnKey='name' />);

    fireEvent.click(screen.getByRole('button', { name: 'Min' }));
    fireEvent.click(screen.getByRole('button', { name: 'Min' }));

    expect(setColumnSizingMock).toHaveBeenCalledTimes(1);
  });

  it('disables min and max presets when the column configures no bounds', () => {
    useGetNormalizedColumnMock.mockReturnValue({ key: 'name', label: 'Name' });

    render(<GeneralSectionHeader columnKey='name' />);

    expect(
      screen.getByRole('button', { name: 'Min' }).hasAttribute('disabled'),
    ).toBe(true);
    expect(
      screen.getByRole('button', { name: 'Max' }).hasAttribute('disabled'),
    ).toBe(true);
  });
});
