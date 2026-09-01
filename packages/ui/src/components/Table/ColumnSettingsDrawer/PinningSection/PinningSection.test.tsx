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

import type { TableColumnLayoutLock } from '#ui/components/Table/Table.types';

const {
  columnPinningRef,
  layoutLockRef,
  mockResetColumnPinning,
  mockSetColumnPinning,
  normalizedColumnRef,
} = vi.hoisted(() => ({
  columnPinningRef: { current: undefined as 'left' | 'right' | undefined },
  layoutLockRef: {
    current: undefined as TableColumnLayoutLock | undefined,
  },
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

vi.mock('#ui/components/Table/hooks', () => ({
  useTableColumnLayoutLock: () => layoutLockRef.current,
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
  layoutLockRef.current = undefined;
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

  it('refuses the pinning a group key holds, and says why', () => {
    columnPinningRef.current = 'left';
    layoutLockRef.current = 'group-key';

    render(<PinningSection />);

    expect(getToggle('Pin Left').disabled).toBe(true);
    expect(getToggle('Pin Right').disabled).toBe(true);
    expect(getToggle('Clear Pinning').disabled).toBe(true);
    expect(
      ['Pin Left', 'Clear Pinning'].map((label) =>
        getToggle(label).getAttribute('title'),
      ),
    ).toStrictEqual([
      'Cannot pin this column: a grouped column is always shown and always pinned to the left.',
      'Cannot pin this column: a grouped column is always shown and always pinned to the left.',
    ]);
  });

  it('leaves a measure pinnable, saying the pinning covers its band', () => {
    layoutLockRef.current = 'measure';

    render(<PinningSection />);

    expect(getToggle('Pin Left').disabled).toBe(false);
    expect(getToggle('Pin Right').disabled).toBe(false);
    expect(
      ['Pin Right', 'Clear Pinning'].map((label) =>
        getToggle(label).getAttribute('title'),
      ),
    ).toStrictEqual([
      'Applies to the whole band: a measure shares the pinning of the column it measures.',
      'Applies to the whole band: a measure shares the pinning of the column it measures.',
    ]);
  });
});
