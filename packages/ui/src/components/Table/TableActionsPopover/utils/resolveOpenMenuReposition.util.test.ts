// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import { computeMenuPosition } from './computeMenuPosition.util';
import { resolveOpenMenuReposition } from './resolveOpenMenuReposition.util';

vi.mock('./computeMenuPosition.util', () => ({
  computeMenuPosition: vi.fn(() => ({ left: 10, top: 20 })),
}));

const CONTAINER_RECT = {
  bottom: 600,
  height: 600,
  left: 0,
  right: 800,
  top: 0,
  width: 800,
} as const;

const createMenuElement = (isOpen: boolean) => {
  const menuElement = document.createElement('div');
  vi.spyOn(menuElement, 'matches').mockReturnValue(isOpen);
  return menuElement;
};

afterEach(() => {
  document.body.replaceChildren();
  vi.clearAllMocks();
});

describe('resolveOpenMenuReposition', () => {
  it('keeps the current position while the menu is not open', () => {
    const getContainerRect = vi.fn(() => CONTAINER_RECT);
    const triggerElement = document.createElement('button');
    document.body.append(triggerElement);

    const outcome = resolveOpenMenuReposition({
      getContainerRect,
      menuElement: createMenuElement(false),
      triggerElement,
    });

    expect(outcome).toEqual({ kind: 'keep' });
    expect(getContainerRect).not.toHaveBeenCalled();
  });

  it('closes when the trigger element is missing', () => {
    const outcome = resolveOpenMenuReposition({
      getContainerRect: () => CONTAINER_RECT,
      menuElement: createMenuElement(true),
      triggerElement: document.getElementById('missing-trigger'),
    });

    expect(outcome).toEqual({ kind: 'close' });
  });

  it('closes when the trigger element is disconnected from the DOM', () => {
    const outcome = resolveOpenMenuReposition({
      getContainerRect: () => CONTAINER_RECT,
      menuElement: createMenuElement(true),
      triggerElement: document.createElement('button'),
    });

    expect(outcome).toEqual({ kind: 'close' });
  });

  it('repositions with computed coordinates when open and connected', () => {
    const menuElement = createMenuElement(true);
    const triggerElement = document.createElement('button');
    document.body.append(triggerElement);

    const outcome = resolveOpenMenuReposition({
      getContainerRect: () => CONTAINER_RECT,
      menuElement,
      triggerElement,
    });

    expect(outcome).toEqual({
      kind: 'reposition',
      position: { left: 10, top: 20 },
    });
    expect(computeMenuPosition).toHaveBeenCalledWith({
      containerRect: CONTAINER_RECT,
      menuElement,
      triggerElement,
    });
  });
});
