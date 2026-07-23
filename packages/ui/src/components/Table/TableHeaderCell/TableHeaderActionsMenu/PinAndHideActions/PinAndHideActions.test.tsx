// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

vi.mock(
  '@lcabrera/ui/components/Table/contexts/TableConfig/columns/actions',
  () => ({
    useSetColumnPinning: () => vi.fn(),
    useSetColumnVisibility: () => vi.fn(),
  }),
);

vi.mock('@lcabrera/ui/components/Table/TableActionsPopover', () => ({
  tableActionsPopoverStyles: {
    menuIcon: {},
    menuItem: {},
    menuSectionDivider: {},
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
});

describe('PinAndHideActions', () => {
  it('composes the pin-left, pin-right, clear-pinning, and hide-column delegates', () => {
    render(<PinAndHideActions columnKey='name' onClose={mockOnClose} />);

    expect(screen.getByText('Pin Left')).not.toBeNull();
    expect(screen.getByText('Pin Right')).not.toBeNull();
    expect(screen.getByText('Clear Pinning')).not.toBeNull();
    expect(screen.getByText('Hide Column')).not.toBeNull();
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
