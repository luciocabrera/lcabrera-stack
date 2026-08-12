// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

const { mockUseTableActionsPopoverPosition, mockUseTableContainerRef } =
  vi.hoisted(() => ({
    mockUseTableActionsPopoverPosition: vi.fn(),
    mockUseTableContainerRef: vi.fn(() => ({ current: undefined })),
  }));

vi.mock('#ui/components/Table/contexts/TableWrapper', () => ({
  useTableContainerRef: mockUseTableContainerRef,
}));

vi.mock('./useTableActionsPopoverPosition.hook', () => ({
  useTableActionsPopoverPosition: mockUseTableActionsPopoverPosition,
}));

import { TableActionsPopover } from './TableActionsPopover.component';

afterEach(cleanup);

describe('TableActionsPopover', () => {
  it('renders the trigger with the provided ariaLabel/label', () => {
    mockUseTableActionsPopoverPosition.mockReturnValue({
      closeMenu: vi.fn(),
      handlePopoverToggle: vi.fn(),
      handleToggleMenu: vi.fn(),
      isMenuOpen: false,
      menuPosition: undefined,
      menuRef: { current: undefined },
    });

    render(
      <TableActionsPopover ariaLabel='Column actions' label='Column actions'>
        {() => <span>Menu content</span>}
      </TableActionsPopover>,
    );

    expect(
      screen.getByRole('button', { name: 'Column actions' }),
    ).not.toBeNull();
    expect(screen.queryByText('Menu content')).toBeNull();
  });

  it('renders children via the render-prop only while the menu is open', () => {
    const closeMenu = vi.fn();
    mockUseTableActionsPopoverPosition.mockReturnValue({
      closeMenu,
      handlePopoverToggle: vi.fn(),
      handleToggleMenu: vi.fn(),
      isMenuOpen: true,
      menuPosition: { left: 10, top: 20 },
      menuRef: { current: undefined },
    });

    render(
      <TableActionsPopover ariaLabel='Column actions' label='Column actions'>
        {(ctx) => (
          <button onClick={ctx.closeMenu} type='button'>
            Close
          </button>
        )}
      </TableActionsPopover>,
    );

    expect(screen.getByText('Close')).not.toBeNull();
    fireEvent.click(screen.getByText('Close'));
    expect(closeMenu).toHaveBeenCalledTimes(1);
  });

  it('invokes handleToggleMenu when the trigger is clicked', () => {
    const handleToggleMenu = vi.fn();
    mockUseTableActionsPopoverPosition.mockReturnValue({
      closeMenu: vi.fn(),
      handlePopoverToggle: vi.fn(),
      handleToggleMenu,
      isMenuOpen: false,
      menuPosition: undefined,
      menuRef: { current: undefined },
    });

    render(
      <TableActionsPopover ariaLabel='Column actions' label='Column actions'>
        {() => {}}
      </TableActionsPopover>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Column actions' }));
    expect(handleToggleMenu).toHaveBeenCalledTimes(1);
  });
});
