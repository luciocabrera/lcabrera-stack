// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { mockSetColumnPinning } = vi.hoisted(() => ({
  mockSetColumnPinning: vi.fn(),
}));

vi.mock(
  '@repo/ui/components/Table/contexts/TableConfig/columns/actions',
  () => ({
    useSetColumnPinning: () => mockSetColumnPinning,
  }),
);

vi.mock('@repo/ui/components/Table/TableActionsPopover', () => ({
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
});
