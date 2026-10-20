// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vite-plus/test';

import { closeTableActionsMenu } from './closeTableActionsMenu.util';

describe('closeTableActionsMenu', () => {
  it('marks the menu closed, drops its coordinates and hides the popover', () => {
    const menu = document.createElement('div');
    const hidePopover = vi.fn();
    menu.hidePopover = hidePopover;
    const setIsMenuOpen = vi.fn();
    const setMenuPosition = vi.fn();

    closeTableActionsMenu({
      menuRef: { current: menu },
      setIsMenuOpen,
      setMenuPosition,
    });

    expect(setIsMenuOpen).toHaveBeenCalledWith(false);
    expect(setMenuPosition).toHaveBeenCalledWith(undefined);
    expect(hidePopover).toHaveBeenCalledOnce();
  });

  it('still clears the state when the menu is not mounted', () => {
    const setIsMenuOpen = vi.fn();
    const setMenuPosition = vi.fn();

    closeTableActionsMenu({
      menuRef: {
        current: document.querySelector<HTMLDivElement>('#missing-menu'),
      },
      setIsMenuOpen,
      setMenuPosition,
    });

    expect(setIsMenuOpen).toHaveBeenCalledWith(false);
    expect(setMenuPosition).toHaveBeenCalledWith(undefined);
  });
});
