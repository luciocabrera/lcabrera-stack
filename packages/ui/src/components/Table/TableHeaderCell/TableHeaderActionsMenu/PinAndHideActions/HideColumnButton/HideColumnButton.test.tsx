// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { TableColumnLayoutLock } from '#ui/components/Table/Table.types';

const { layoutLockRef, mockSetColumnVisibility } = vi.hoisted(() => ({
  layoutLockRef: { current: undefined as TableColumnLayoutLock | undefined },
  mockSetColumnVisibility: vi.fn(),
}));

vi.mock('#ui/components/Table/contexts/TableConfig/columns/actions', () => ({
  useSetColumnVisibility: () => mockSetColumnVisibility,
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

import { HideColumnButton } from './HideColumnButton.component';

const mockOnClose = vi.fn();

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  layoutLockRef.current = undefined;
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

describe('HideColumnButton under a layout lock', () => {
  it('is disabled while the column is a group key', () => {
    layoutLockRef.current = 'group-key';

    render(<HideColumnButton columnKey='name' onClose={mockOnClose} />);

    const button = screen.getByText('Hide Column').closest('button');

    expect(button?.disabled).toBe(true);
    expect(button?.getAttribute('title')).toBe(
      'Cannot hide this column: a grouped column is always shown and always pinned to the left.',
    );
  });

  it('stays enabled on a measure, which hides with the column it measures', () => {
    layoutLockRef.current = 'measure';

    render(<HideColumnButton columnKey='amount:sum' onClose={mockOnClose} />);

    fireEvent.click(screen.getByText('Hide Column'));

    expect(mockSetColumnVisibility).toHaveBeenCalledWith({
      columnKey: 'amount:sum',
      isVisible: false,
    });
  });
});
