// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { mockSetTableColumnSelectedKey, mockSetTableDrawersOpenState } =
  vi.hoisted(() => ({
    mockSetTableColumnSelectedKey: vi.fn(),
    mockSetTableDrawersOpenState: vi.fn(),
  }));

vi.mock('@repo/ui/components/Table/contexts/TableConfig/meta/actions', () => ({
  useSetTableColumnSelectedKey: () => mockSetTableColumnSelectedKey,
  useSetTableDrawersOpenState: () => mockSetTableDrawersOpenState,
}));

vi.mock('@repo/ui/components/Table/TableActionsPopover', () => ({
  tableActionsPopoverStyles: {
    menuIcon: {},
    menuItem: {},
    menuSectionDivider: {},
  },
}));

import { ManageColumnAction } from './ManageColumnAction.component';

const mockOnClose = vi.fn();

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ManageColumnAction', () => {
  it('renders the Manage Column item', () => {
    render(<ManageColumnAction columnKey='name' onClose={mockOnClose} />);

    expect(screen.getByText('Manage Column')).not.toBeNull();
  });

  it('selects the column, opens the settings drawer, and closes the menu', () => {
    render(<ManageColumnAction columnKey='name' onClose={mockOnClose} />);

    fireEvent.click(screen.getByText('Manage Column'));

    expect(mockSetTableColumnSelectedKey).toHaveBeenCalledWith('name');
    expect(mockSetTableDrawersOpenState).toHaveBeenCalledWith({
      isColumnSettingsOpen: true,
      isTableSettingsOpen: false,
    });
    expect(mockOnClose).toHaveBeenCalled();
  });
});
