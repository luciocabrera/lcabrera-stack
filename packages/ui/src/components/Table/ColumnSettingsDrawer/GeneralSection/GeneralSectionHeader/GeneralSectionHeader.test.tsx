// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { setColumnSizingMock, useGetNormalizedColumnMock } = vi.hoisted(() => ({
  setColumnSizingMock: vi.fn(),
  useGetNormalizedColumnMock: vi.fn(),
}));

type MockPresetButtonsProps = {
  readonly isMaxDisabled?: boolean;
  readonly isMinDisabled?: boolean;
  readonly onToggleDefault: () => void;
  readonly onToggleMax: () => void;
  readonly onToggleMin: () => void;
  readonly selectedPreset?: string;
};

vi.mock('@lcabrera/ui/components/SidePanel', () => ({
  SidePanelSection: ({ children }: { readonly children: React.ReactNode }) => (
    <section>{children}</section>
  ),
  SidePanelSectionHeader: ({ title }: { readonly title: string }) => (
    <h3>{title}</h3>
  ),
}));

vi.mock(
  '@lcabrera/ui/components/Table/contexts/TableConfig/columns/selectors',
  () => ({
    useGetNormalizedColumn: () => useGetNormalizedColumnMock(),
  }),
);

vi.mock(
  '@lcabrera/ui/components/Table/shared/ColumnWidthPresetButtons',
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import('@lcabrera/ui/components/Table/shared/ColumnWidthPresetButtons')
    >()),
    ColumnWidthPresetButtons: ({
      isMaxDisabled,
      isMinDisabled,
      onToggleDefault,
      onToggleMax,
      onToggleMin,
      selectedPreset,
    }: MockPresetButtonsProps) => (
      <div data-selected-preset={selectedPreset ?? 'none'}>
        <button disabled={isMinDisabled} onClick={onToggleMin} type='button'>
          Min
        </button>
        <button disabled={isMaxDisabled} onClick={onToggleMax} type='button'>
          Max
        </button>
        <button onClick={onToggleDefault} type='button'>
          Default
        </button>
      </div>
    ),
  }),
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
