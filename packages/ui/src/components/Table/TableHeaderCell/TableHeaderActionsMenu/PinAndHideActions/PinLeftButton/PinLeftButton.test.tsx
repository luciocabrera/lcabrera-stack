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
    menuSectionDivider: {},
  },
}));

import { PinLeftButton } from './PinLeftButton.component';

const mockOnClose = vi.fn();

const getButton = () => {
  const button = screen.getByText('Pin Left').closest('button');
  if (button === null) throw new Error('No Pin Left button');
  return button;
};

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
});
