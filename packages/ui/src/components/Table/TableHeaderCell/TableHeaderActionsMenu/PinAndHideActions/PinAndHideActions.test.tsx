// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { TableColumnLayoutLock } from '#ui/components/Table/Table.types';

const { layoutLockRef } = vi.hoisted(() => ({
  layoutLockRef: { current: undefined as TableColumnLayoutLock | undefined },
}));

vi.mock('#ui/components/Table/contexts/TableConfig/columns/actions', () => ({
  useSetColumnPinning: () => vi.fn(),
  useSetColumnVisibility: () => vi.fn(),
}));

vi.mock('#ui/components/Table/contexts/TableConfig/columns/selectors', () => ({
  useGetNormalizedColumn: () => ({ key: 'name', label: 'Name' }),
}));

vi.mock('#ui/components/Table/hooks', () => ({
  useTableColumnLayoutLock: () => layoutLockRef.current,
}));

vi.mock('#ui/components/Table/TableActionsPopover', () => ({
  TableActionsPopoverSeparator: () => <hr />,
  tableActionsPopoverStyles: {
    menuIcon: {},
    menuItem: {},
  },
}));

import { PinAndHideActions } from './PinAndHideActions.component';

const mockOnClose = vi.fn();

const getButton = (label: string) => {
  const button = screen.getByText(label).closest('button');
  if (button === null) throw new Error(`No button for "${label}"`);
  return button;
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  layoutLockRef.current = undefined;
});

describe('PinAndHideActions', () => {
  it('composes the pin-left, pin-right, clear-pinning, and hide-column delegates', () => {
    render(<PinAndHideActions columnKey='name' onClose={mockOnClose} />);

    expect(screen.getByText('Pin Left')).not.toBeNull();
    expect(screen.getByText('Pin Right')).not.toBeNull();
    expect(screen.getByText('Clear Pinning')).not.toBeNull();
    expect(screen.getByText('Hide Column')).not.toBeNull();
  });

  it('separates Hide Column from the pinning choices', () => {
    render(<PinAndHideActions columnKey='name' onClose={mockOnClose} />);

    expect(screen.getAllByRole('separator')).toHaveLength(1);
  });

  it('threads the current pinSide into each delegate', () => {
    render(
      <PinAndHideActions
        columnKey='name'
        onClose={mockOnClose}
        pinSide='left'
      />,
    );

    expect(getButton('Pin Left').getAttribute('aria-pressed')).toBe('true');
    expect(getButton('Pin Right').getAttribute('aria-pressed')).toBe('false');
    expect(getButton('Clear Pinning').disabled).toBe(false);
  });

  it('disables Clear Pinning when no side is pinned', () => {
    render(<PinAndHideActions columnKey='name' onClose={mockOnClose} />);

    expect(getButton('Clear Pinning').disabled).toBe(true);
  });
});

const PINNING_ITEMS = ['Pin Left', 'Pin Right', 'Clear Pinning'];

const renderLocked = (lock: TableColumnLayoutLock) => {
  layoutLockRef.current = lock;

  render(
    <PinAndHideActions columnKey='name' onClose={mockOnClose} pinSide='left' />,
  );
};

describe('PinAndHideActions under a layout lock', () => {
  it('refuses every layout action on a group key', () => {
    renderLocked('group-key');

    expect(PINNING_ITEMS.map((item) => getButton(item).disabled)).toStrictEqual(
      [true, true, true],
    );
    expect(getButton('Hide Column').disabled).toBe(true);
  });

  it('refuses only the pinning on a measure, leaving Hide Column working', () => {
    renderLocked('measure');

    expect(PINNING_ITEMS.map((item) => getButton(item).disabled)).toStrictEqual(
      [true, true, true],
    );
    expect(getButton('Hide Column').disabled).toBe(false);
  });

  it('states the reason on each refused item, which fires no pointer events', () => {
    renderLocked('group-key');

    expect(
      [...PINNING_ITEMS, 'Hide Column'].map((item) =>
        getButton(item).getAttribute('title'),
      ),
    ).toStrictEqual([
      'Cannot pin this column: a grouped column is always shown and always pinned to the left.',
      'Cannot pin this column: a grouped column is always shown and always pinned to the left.',
      'Cannot pin this column: a grouped column is always shown and always pinned to the left.',
      'Cannot hide this column: a grouped column is always shown and always pinned to the left.',
    ]);
  });

  it('leaves all four enabled when no lock applies', () => {
    render(
      <PinAndHideActions
        columnKey='name'
        onClose={mockOnClose}
        pinSide='left'
      />,
    );

    expect(
      [...PINNING_ITEMS, 'Hide Column'].map((item) => getButton(item).disabled),
    ).toStrictEqual([false, false, false, false]);
  });
});
