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

const { mockSetColumnPinning, normalizedColumnRef } = vi.hoisted(() => ({
  mockSetColumnPinning: vi.fn(),
  normalizedColumnRef: { current: {} as Record<string, unknown> },
}));

vi.mock('#ui/components/Table/contexts/TableConfig/columns/actions', () => ({
  useSetColumnPinning: () => mockSetColumnPinning,
}));

vi.mock('#ui/components/Table/contexts/TableConfig/columns/selectors', () => ({
  useGetNormalizedColumn: () => normalizedColumnRef.current,
}));

import { ColumnPinningButton } from './ColumnPinningButton.component';

const mockOnClose = vi.fn();

const getButton = (name: string) =>
  screen.getByRole<HTMLButtonElement>('button', { name });

beforeEach(() => {
  normalizedColumnRef.current = { key: 'name', label: 'Name' };
});

afterEach(() => {
  cleanup();
});

describe.each([
  { label: 'Pin Left', side: 'left' },
  { label: 'Pin Right', side: 'right' },
] as const)('ColumnPinningButton targeting $side', ({ label, side }) => {
  it(`pins ${side} and closes the menu when not already pinned ${side}`, () => {
    render(
      <ColumnPinningButton
        columnKey='name'
        onClose={mockOnClose}
        target={side}
      />,
    );

    fireEvent.click(getButton(label));

    expect(mockSetColumnPinning).toHaveBeenCalledWith({
      columnKey: 'name',
      side,
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it(`toggles pinning off when already pinned ${side}`, () => {
    render(
      <ColumnPinningButton
        columnKey='name'
        onClose={mockOnClose}
        pinSide={side}
        target={side}
      />,
    );

    fireEvent.click(getButton(label));

    expect(mockSetColumnPinning).toHaveBeenCalledWith({
      columnKey: 'name',
      side: undefined,
    });
  });

  it(`marks itself pressed only while pinned ${side}`, () => {
    const { rerender } = render(
      <ColumnPinningButton
        columnKey='name'
        onClose={mockOnClose}
        target={side}
      />,
    );
    expect(getButton(label).getAttribute('aria-pressed')).toBe('false');

    rerender(
      <ColumnPinningButton
        columnKey='name'
        onClose={mockOnClose}
        pinSide={side}
        target={side}
      />,
    );
    expect(getButton(label).getAttribute('aria-pressed')).toBe('true');
  });

  it('is disabled when the column has no pinning capability', () => {
    normalizedColumnRef.current = {
      isStatic: true,
      key: 'name',
      label: 'Name',
    };

    render(
      <ColumnPinningButton
        columnKey='name'
        onClose={mockOnClose}
        target={side}
      />,
    );

    expect(getButton(label).disabled).toBe(true);
  });
});

describe('ColumnPinningButton targeting clear', () => {
  it('is disabled when no side is pinned', () => {
    render(
      <ColumnPinningButton
        columnKey='name'
        onClose={mockOnClose}
        target='clear'
      />,
    );

    expect(getButton('Clear Pinning').disabled).toBe(true);
  });

  it('clears the pinning and closes the menu when a side is pinned', () => {
    render(
      <ColumnPinningButton
        columnKey='name'
        onClose={mockOnClose}
        pinSide='right'
        target='clear'
      />,
    );

    expect(getButton('Clear Pinning').disabled).toBe(false);

    fireEvent.click(getButton('Clear Pinning'));

    expect(mockSetColumnPinning).toHaveBeenCalledWith({
      columnKey: 'name',
      side: undefined,
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('is not a toggle, so it carries no pressed state', () => {
    render(
      <ColumnPinningButton
        columnKey='name'
        onClose={mockOnClose}
        pinSide='left'
        target='clear'
      />,
    );

    expect(getButton('Clear Pinning').hasAttribute('aria-pressed')).toBe(false);
  });

  it('is disabled when the column has no pinning capability', () => {
    normalizedColumnRef.current = {
      isStatic: true,
      key: 'name',
      label: 'Name',
    };

    render(
      <ColumnPinningButton
        columnKey='name'
        onClose={mockOnClose}
        pinSide='left'
        target='clear'
      />,
    );

    expect(getButton('Clear Pinning').disabled).toBe(true);
  });
});
