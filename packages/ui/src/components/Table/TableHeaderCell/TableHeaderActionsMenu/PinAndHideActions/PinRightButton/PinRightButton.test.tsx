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

const { layoutLockRef, mockSetColumnPinning, normalizedColumnRef } = vi.hoisted(
  () => ({
    layoutLockRef: {
      current: undefined as TableColumnLayoutLock | undefined,
    },
    mockSetColumnPinning: vi.fn(),
    normalizedColumnRef: { current: {} as Record<string, unknown> },
  }),
);

vi.mock('#ui/components/Table/contexts/TableConfig/columns/actions', () => ({
  useSetColumnPinning: () => mockSetColumnPinning,
}));

vi.mock('#ui/components/Table/contexts/TableConfig/columns/selectors', () => ({
  useGetNormalizedColumn: () => normalizedColumnRef.current,
}));

vi.mock('#ui/components/Table/hooks', () => ({
  useTableColumnLayoutLock: () => layoutLockRef.current,
}));

vi.mock('#ui/components/Table/TableActionsPopover', () => ({
  tableActionsPopoverStyles: {
    menuIcon: {},
    menuItem: {},
  },
}));

import { PinRightButton } from './PinRightButton.component';

const mockOnClose = vi.fn();

const getButton = () => {
  const button = screen.getByText('Pin Right').closest('button');
  if (button === null) throw new Error('No Pin Right button');
  return button;
};

beforeEach(() => {
  normalizedColumnRef.current = { key: 'name', label: 'Name' };
  layoutLockRef.current = undefined;
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('PinRightButton', () => {
  it('pins right and closes the menu when not already pinned right', () => {
    render(<PinRightButton columnKey='name' onClose={mockOnClose} />);

    fireEvent.click(getButton());

    expect(mockSetColumnPinning).toHaveBeenCalledWith({
      columnKey: 'name',
      side: 'right',
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('toggles pinning off when already pinned right', () => {
    render(
      <PinRightButton columnKey='name' onClose={mockOnClose} pinSide='right' />,
    );

    fireEvent.click(getButton());

    expect(mockSetColumnPinning).toHaveBeenCalledWith({
      columnKey: 'name',
      side: undefined,
    });
  });

  it('marks itself pressed only while pinned right', () => {
    const { rerender } = render(
      <PinRightButton columnKey='name' onClose={mockOnClose} />,
    );
    expect(getButton().getAttribute('aria-pressed')).toBe('false');

    rerender(
      <PinRightButton columnKey='name' onClose={mockOnClose} pinSide='right' />,
    );
    expect(getButton().getAttribute('aria-pressed')).toBe('true');
  });

  it('is disabled when the column has no pinning capability', () => {
    normalizedColumnRef.current = {
      isStatic: true,
      key: 'name',
      label: 'Name',
    };

    render(<PinRightButton columnKey='name' onClose={mockOnClose} />);

    expect(getButton().disabled).toBe(true);
  });
});
