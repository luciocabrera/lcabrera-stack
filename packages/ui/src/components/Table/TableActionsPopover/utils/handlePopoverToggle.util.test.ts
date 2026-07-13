// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';

import { handlePopoverToggle } from './handlePopoverToggle.util';

type CreateMenuElementArgs = {
  readonly isOpen: boolean;
};

const createMenuElement = ({ isOpen }: CreateMenuElementArgs) => {
  const menu = document.createElement('div');
  menu.matches = ((selectors: string) =>
    selectors === ':popover-open' && isOpen) as HTMLDivElement['matches'];

  return menu;
};

describe('handlePopoverToggle', () => {
  it('does nothing when the menu element is not mounted', () => {
    const setIsMenuOpen = vi.fn();
    const setMenuPosition = vi.fn();

    handlePopoverToggle({ menuElement: null, setIsMenuOpen, setMenuPosition });

    expect(setIsMenuOpen).not.toHaveBeenCalled();
    expect(setMenuPosition).not.toHaveBeenCalled();
  });

  it('marks the menu open and keeps the coordinates when the popover opened', () => {
    const setIsMenuOpen = vi.fn();
    const setMenuPosition = vi.fn();

    handlePopoverToggle({
      menuElement: createMenuElement({ isOpen: true }),
      setIsMenuOpen,
      setMenuPosition,
    });

    expect(setIsMenuOpen).toHaveBeenCalledWith(true);
    expect(setMenuPosition).not.toHaveBeenCalled();
  });

  it('marks the menu closed and clears the coordinates when the popover closed', () => {
    const setIsMenuOpen = vi.fn();
    const setMenuPosition = vi.fn();

    handlePopoverToggle({
      menuElement: createMenuElement({ isOpen: false }),
      setIsMenuOpen,
      setMenuPosition,
    });

    expect(setIsMenuOpen).toHaveBeenCalledWith(false);
    expect(setMenuPosition).toHaveBeenCalledWith(undefined);
  });
});
