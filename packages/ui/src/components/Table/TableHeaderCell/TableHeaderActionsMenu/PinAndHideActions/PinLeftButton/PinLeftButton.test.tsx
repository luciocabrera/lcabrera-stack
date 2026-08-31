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

import { PinLeftButton } from './PinLeftButton.component';

const mockOnClose = vi.fn();

const getButton = () => {
  const button = screen.getByText('Pin Left').closest('button');
  if (button === null) throw new Error('No Pin Left button');
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

describe('PinLeftButton', () => {
  it('pins left and closes the menu when not already pinned left', () => {
    render(<PinLeftButton columnKey='name' onClose={mockOnClose} />);

    fireEvent.click(getButton());

    expect(mockSetColumnPinning).toHaveBeenCalledWith({
      columnKey: 'name',
      side: 'left',
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('toggles pinning off when already pinned left', () => {
    render(
      <PinLeftButton columnKey='name' onClose={mockOnClose} pinSide='left' />,
    );

    fireEvent.click(getButton());

    expect(mockSetColumnPinning).toHaveBeenCalledWith({
      columnKey: 'name',
      side: undefined,
    });
  });

  it('marks itself pressed only while pinned left', () => {
    const { rerender } = render(
      <PinLeftButton columnKey='name' onClose={mockOnClose} />,
    );
    expect(getButton().getAttribute('aria-pressed')).toBe('false');

    rerender(
      <PinLeftButton columnKey='name' onClose={mockOnClose} pinSide='left' />,
    );
    expect(getButton().getAttribute('aria-pressed')).toBe('true');
  });

  it('is disabled when the column has no pinning capability', () => {
    normalizedColumnRef.current = {
      isStatic: true,
      key: 'name',
      label: 'Name',
    };

    render(<PinLeftButton columnKey='name' onClose={mockOnClose} />);

    expect(getButton().disabled).toBe(true);
  });
});

describe('PinLeftButton under a layout lock', () => {
  it('is disabled while the column is a group key', () => {
    layoutLockRef.current = 'group-key';

    render(
      <PinLeftButton columnKey='name' onClose={mockOnClose} pinSide='left' />,
    );

    expect(getButton().disabled).toBe(true);
  });

  it('is disabled while the column is a measure', () => {
    layoutLockRef.current = 'measure';

    render(
      <PinLeftButton columnKey='name' onClose={mockOnClose} pinSide='left' />,
    );

    expect(getButton().disabled).toBe(true);
  });

  it('states the reason on the item, which fires no pointer events once disabled', () => {
    layoutLockRef.current = 'group-key';

    render(
      <PinLeftButton columnKey='name' onClose={mockOnClose} pinSide='left' />,
    );

    expect(getButton().getAttribute('title')).toBe(
      'Cannot pin this column: a grouped column is always shown and always pinned to the left.',
    );
  });

  it('is enabled again once no lock applies', () => {
    render(
      <PinLeftButton columnKey='name' onClose={mockOnClose} pinSide='left' />,
    );

    expect(getButton().disabled).toBe(false);
  });
});
