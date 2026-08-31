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

describe('PinAndHideActions under a layout lock', () => {
  it('refuses every layout action on a group key', () => {
    layoutLockRef.current = 'group-key';

    render(
      <PinAndHideActions
        columnKey='name'
        onClose={mockOnClose}
        pinSide='left'
      />,
    );

    expect(getButton('Pin Left').disabled).toBe(true);
    expect(getButton('Pin Right').disabled).toBe(true);
    expect(getButton('Clear Pinning').disabled).toBe(true);
    expect(getButton('Hide Column').disabled).toBe(true);
  });

  it('refuses only the pinning on a measure', () => {
    layoutLockRef.current = 'measure';

    render(
      <PinAndHideActions
        columnKey='name'
        onClose={mockOnClose}
        pinSide='left'
      />,
    );

    expect(getButton('Pin Left').disabled).toBe(true);
    expect(getButton('Pin Right').disabled).toBe(true);
    expect(getButton('Clear Pinning').disabled).toBe(true);
    expect(getButton('Hide Column').disabled).toBe(false);
  });
});
