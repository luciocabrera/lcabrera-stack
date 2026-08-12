// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

const { mockSetColumnVisibility } = vi.hoisted(() => ({
  mockSetColumnVisibility: vi.fn(),
}));

vi.mock('#ui/components/Table/contexts/TableConfig/columns/actions', () => ({
  useSetColumnVisibility: () => mockSetColumnVisibility,
}));

vi.mock('#ui/components/Table/TableActionsPopover', () => ({
  tableActionsPopoverStyles: {
    menuIcon: {},
    menuItem: {},
  },
}));

import { HideColumnButton } from './HideColumnButton.component';

const mockOnClose = vi.fn();

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('HideColumnButton', () => {
  it('hides the column via useSetColumnVisibility and closes the menu', () => {
    render(<HideColumnButton columnKey='name' onClose={mockOnClose} />);

    fireEvent.click(screen.getByText('Hide Column'));

    expect(mockSetColumnVisibility).toHaveBeenCalledWith({
      columnKey: 'name',
      isVisible: false,
    });
    expect(mockOnClose).toHaveBeenCalled();
  });
});
