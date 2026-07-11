// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { setColumnsSizingMock, useGetColumnsMock } = vi.hoisted(() => ({
  setColumnsSizingMock: vi.fn(),
  useGetColumnsMock: vi.fn(() => [] as unknown[]),
}));

type MockPresetButtonsProps = {
  readonly isMaxDisabled?: boolean;
  readonly isMinDisabled?: boolean;
  readonly onToggleDefault: () => void;
  readonly onToggleMax: () => void;
  readonly onToggleMin: () => void;
  readonly selectedPreset?: string;
};

vi.mock('@repo/ui/components/SidePanel', () => ({
  SidePanelSection: ({ children }: { readonly children: React.ReactNode }) => (
    <section>{children}</section>
  ),
  SidePanelSectionHeader: ({ title }: { readonly title: string }) => (
    <h3>{title}</h3>
  ),
}));

vi.mock(
  '@repo/ui/components/Table/contexts/TableConfig/columns/selectors/useGetColumns.hook',
  () => ({
    useGetColumns: () => useGetColumnsMock(),
  }),
);

vi.mock('@repo/ui/components/Table/shared/ColumnWidthPresetButtons', () => ({
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
}));

vi.mock('../../TableDrawerContext/actions', () => ({
  useSetColumnsSizing: () => setColumnsSizingMock,
}));

import { ColumnWidthsSection } from './ColumnWidthsSection.component';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  setColumnsSizingMock.mockReset();
  useGetColumnsMock.mockReset();
  useGetColumnsMock.mockReturnValue([
    { key: 'id', label: 'Id', maxWidth: 120, minWidth: 60 },
    { key: 'name', label: 'Name', minWidth: 100 },
  ]);
});

describe('ColumnWidthsSection', () => {
  it('renders the section header', () => {
    render(<ColumnWidthsSection />);

    expect(screen.getByRole('heading', { name: 'Column Widths' })).not.toBe(
      null,
    );
  });

  it('applies the min preset sizing for columns with a min width', () => {
    render(<ColumnWidthsSection />);

    fireEvent.click(screen.getByRole('button', { name: 'Min' }));

    expect(setColumnsSizingMock).toHaveBeenCalledWith({ id: 60, name: 100 });
  });

  it('applies the max preset sizing for columns with a max width', () => {
    render(<ColumnWidthsSection />);

    fireEvent.click(screen.getByRole('button', { name: 'Max' }));

    expect(setColumnsSizingMock).toHaveBeenCalledWith({ id: 120 });
  });

  it('clears custom sizing for the default preset', () => {
    render(<ColumnWidthsSection />);

    fireEvent.click(screen.getByRole('button', { name: 'Default' }));

    expect(setColumnsSizingMock).toHaveBeenCalledWith({});
  });

  it('deselects a toggled preset without writing sizing again', () => {
    render(<ColumnWidthsSection />);

    fireEvent.click(screen.getByRole('button', { name: 'Min' }));
    fireEvent.click(screen.getByRole('button', { name: 'Min' }));

    expect(setColumnsSizingMock).toHaveBeenCalledTimes(1);
  });

  it('disables min and max presets when no column configures them', () => {
    useGetColumnsMock.mockReturnValue([{ key: 'id', label: 'Id' }]);

    render(<ColumnWidthsSection />);

    expect(
      screen.getByRole('button', { name: 'Min' }).hasAttribute('disabled'),
    ).toBe(true);
    expect(
      screen.getByRole('button', { name: 'Max' }).hasAttribute('disabled'),
    ).toBe(true);
  });
});
