// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { mockSetColumnPinning, mockSetColumnVisibility } = vi.hoisted(() => ({
  mockSetColumnPinning: vi.fn(),
  mockSetColumnVisibility: vi.fn(),
}));

vi.mock(
  '@repo/ui/components/Table/contexts/TableConfig/columns/actions',
  () => ({
    useSetColumnPinning: () => mockSetColumnPinning,
    useSetColumnVisibility: () => mockSetColumnVisibility,
  }),
);

vi.mock('@repo/ui/components/Table/TableActionsPopover', () => ({
  tableActionsPopoverStyles: {
    menuIcon: {},
    menuItem: {},
  },
}));

import { PinAndHideActions } from './PinAndHideActions.component';

const mockOnClose = vi.fn();

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('PinAndHideActions', () => {
  it('renders the Pin Left, Pin Right, and Hide Column items', () => {
    render(<PinAndHideActions columnKey='name' onClose={mockOnClose} />);

    expect(screen.getByText('Pin Left')).not.toBeNull();
    expect(screen.getByText('Pin Right')).not.toBeNull();
    expect(screen.getByText('Hide Column')).not.toBeNull();
  });

  it('pins left and closes the menu when not already pinned', () => {
    render(<PinAndHideActions columnKey='name' onClose={mockOnClose} />);

    fireEvent.click(screen.getByText('Pin Left'));

    expect(mockSetColumnPinning).toHaveBeenCalledWith({
      columnKey: 'name',
      side: 'left',
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('toggles Pin Left off when already pinned left', () => {
    render(
      <PinAndHideActions
        columnKey='name'
        onClose={mockOnClose}
        pinSide='left'
      />,
    );

    fireEvent.click(screen.getByText('Pin Left'));

    expect(mockSetColumnPinning).toHaveBeenCalledWith({
      columnKey: 'name',
      side: undefined,
    });
  });

  it('pins right when not already pinned right', () => {
    render(<PinAndHideActions columnKey='name' onClose={mockOnClose} />);

    fireEvent.click(screen.getByText('Pin Right'));

    expect(mockSetColumnPinning).toHaveBeenCalledWith({
      columnKey: 'name',
      side: 'right',
    });
  });

  it('toggles Pin Right off when already pinned right', () => {
    render(
      <PinAndHideActions
        columnKey='name'
        onClose={mockOnClose}
        pinSide='right'
      />,
    );

    fireEvent.click(screen.getByText('Pin Right'));

    expect(mockSetColumnPinning).toHaveBeenCalledWith({
      columnKey: 'name',
      side: undefined,
    });
  });

  it('hides the column via useSetColumnVisibility and closes the menu', () => {
    render(<PinAndHideActions columnKey='name' onClose={mockOnClose} />);

    fireEvent.click(screen.getByText('Hide Column'));

    expect(mockSetColumnVisibility).toHaveBeenCalledWith({
      columnKey: 'name',
      isVisible: false,
    });
    expect(mockOnClose).toHaveBeenCalled();
  });
});
