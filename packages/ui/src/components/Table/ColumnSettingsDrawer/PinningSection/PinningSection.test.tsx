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

const {
  columnPinningRef,
  mockResetColumnPinning,
  mockSetColumnPinning,
  normalizedColumnRef,
} = vi.hoisted(() => ({
  columnPinningRef: { current: undefined as 'left' | 'right' | undefined },
  mockResetColumnPinning: vi.fn(),
  mockSetColumnPinning: vi.fn(),
  normalizedColumnRef: { current: {} as Record<string, unknown> },
}));

vi.mock('../ColumnDrawerContext/actions', () => ({
  useResetColumnPinning: () => mockResetColumnPinning,
  useSetColumnPinning: () => mockSetColumnPinning,
}));

vi.mock('../ColumnDrawerContext/selectors', () => ({
  useGetColumnPinning: () => columnPinningRef.current,
}));

vi.mock('#ui/components/Table/contexts/TableConfig/columns/selectors', () => ({
  useGetNormalizedColumn: () => normalizedColumnRef.current,
}));

vi.mock('#ui/components/Table/contexts/TableConfig/meta/selectors', () => ({
  useGetTableColumnSelectedKey: () => 'name',
}));

import { PinningSection } from './PinningSection.component';

const getToggle = (label: string) => {
  const button = screen
    .getAllByText(label)
    .map((node) => node.closest('button'))
    .find((node) => node !== null);
  if (button === undefined) throw new Error(`No "${label}" button`);
  return button;
};

beforeEach(() => {
  columnPinningRef.current = undefined;
  normalizedColumnRef.current = { key: 'name', label: 'Name' };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('PinningSection', () => {
  it('renders both pinning commands and dispatches nothing on its own', () => {
    render(<PinningSection />);

    expect(getToggle('Pin Left')).not.toBeNull();
    expect(getToggle('Pin Right')).not.toBeNull();
    expect(mockSetColumnPinning).not.toHaveBeenCalled();
  });

  it('pins left from the draft state and toggles back off when already left', () => {
    const { rerender } = render(<PinningSection />);

    fireEvent.click(getToggle('Pin Left'));
    expect(mockSetColumnPinning).toHaveBeenCalledWith('left');

    columnPinningRef.current = 'left';
    rerender(<PinningSection />);

    fireEvent.click(getToggle('Pin Left'));
    expect(mockSetColumnPinning).toHaveBeenCalledWith(undefined);
  });

  it('pins right independently of the left draft state', () => {
    columnPinningRef.current = 'left';
    render(<PinningSection />);

    fireEvent.click(getToggle('Pin Right'));

    expect(mockSetColumnPinning).toHaveBeenCalledWith('right');
  });

  it('disables both commands when the column has no pinning capability', () => {
    normalizedColumnRef.current = {
      isStatic: true,
      key: 'name',
      label: 'Name',
    };

    render(<PinningSection />);

    expect(getToggle('Pin Left').disabled).toBe(true);
    expect(getToggle('Pin Right').disabled).toBe(true);
  });
});
