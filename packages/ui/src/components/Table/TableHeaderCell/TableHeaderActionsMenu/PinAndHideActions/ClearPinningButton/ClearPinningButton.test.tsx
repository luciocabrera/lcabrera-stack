// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { mockSetColumnPinning } = vi.hoisted(() => ({
  mockSetColumnPinning: vi.fn(),
}));

vi.mock(
  '@lcabrera/ui/components/Table/contexts/TableConfig/columns/actions',
  () => ({
    useSetColumnPinning: () => mockSetColumnPinning,
  }),
);

vi.mock('@lcabrera/ui/components/Table/TableActionsPopover', () => ({
  tableActionsPopoverStyles: {
    menuIcon: {},
    menuItem: {},
  },
}));

import { ClearPinningButton } from './ClearPinningButton.component';

const mockOnClose = vi.fn();

const getButton = () => {
  const button = screen.getByText('Clear Pinning').closest('button');
  if (button === null) throw new Error('No Clear Pinning button');
  return button;
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ClearPinningButton', () => {
  it('is disabled when no side is pinned', () => {
    render(<ClearPinningButton columnKey='name' onClose={mockOnClose} />);

    expect(getButton().disabled).toBe(true);
  });

  it('clears the pinning and closes the menu when a side is pinned', () => {
    render(
      <ClearPinningButton
        columnKey='name'
        onClose={mockOnClose}
        pinSide='right'
      />,
    );

    expect(getButton().disabled).toBe(false);

    fireEvent.click(getButton());

    expect(mockSetColumnPinning).toHaveBeenCalledWith({
      columnKey: 'name',
      side: undefined,
    });
    expect(mockOnClose).toHaveBeenCalled();
  });
});
