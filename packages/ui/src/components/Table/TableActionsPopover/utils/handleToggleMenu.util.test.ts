// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vite-plus/test';

import type { BoundsRect } from '../TableActionsPopover.types';

import { MENU_REPOSITION_FRAMES } from '../TableActionsPopover.constants';
import { handleToggleMenu } from './handleToggleMenu.util';

const containerRect: BoundsRect = {
  bottom: 800,
  height: 800,
  left: 0,
  right: 1200,
  top: 0,
  width: 1200,
};

const createRect = (rect: BoundsRect) => () => rect as DOMRect;

type CreateMenuElementArgs = {
  readonly isOpen: boolean;
};

const createMenuElement = ({ isOpen }: CreateMenuElementArgs) => {
  const menu = document.createElement('div');
  let isPopoverOpen = isOpen;

  menu.matches = ((selectors: string) =>
    selectors === ':popover-open' &&
    isPopoverOpen) as HTMLDivElement['matches'];
  const showPopover = vi.fn(() => {
    isPopoverOpen = true;
  });
  menu.showPopover = showPopover;
  menu.getBoundingClientRect = createRect({
    bottom: 150,
    height: 150,
    left: 0,
    right: 200,
    top: 0,
    width: 200,
  });

  return { menu, showPopover };
};

const createConnectedTrigger = () => {
  const trigger = document.createElement('button');
  trigger.getBoundingClientRect = createRect({
    bottom: 130,
    height: 40,
    left: 500,
    right: 540,
    top: 90,
    width: 40,
  });
  document.body.append(trigger);

  return trigger;
};

const createFrameQueue = () => {
  const frames: FrameRequestCallback[] = [];
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn((callback: FrameRequestCallback) => {
      frames.push(callback);
    }),
  );

  return {
    flushNextFrame: () => {
      frames.shift()?.(0);
    },
    getPendingFrameCount: () => frames.length,
  };
};

const createHandlerArgs = () => ({
  closeMenu: vi.fn(),
  getContainerRect: vi.fn(() => containerRect),
  setIsMenuOpen: vi.fn(),
  setMenuPosition: vi.fn(),
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

describe('handleToggleMenu', () => {
  it('does nothing when the menu element is not mounted', () => {
    const frameQueue = createFrameQueue();
    const handlerArgs = createHandlerArgs();

    handleToggleMenu({
      ...handlerArgs,
      getTriggerElement: () => document.getElementById('missing-trigger'),
      menuElement: document.querySelector<HTMLDivElement>('#missing-menu'),
    });

    expect(handlerArgs.setIsMenuOpen).not.toHaveBeenCalled();
    expect(handlerArgs.closeMenu).not.toHaveBeenCalled();
    expect(frameQueue.getPendingFrameCount()).toBe(0);
  });

  it('closes an already-open menu without reopening it', () => {
    const frameQueue = createFrameQueue();
    const handlerArgs = createHandlerArgs();
    const { menu: menuElement, showPopover } = createMenuElement({
      isOpen: true,
    });

    handleToggleMenu({
      ...handlerArgs,
      getTriggerElement: () => document.getElementById('missing-trigger'),
      menuElement,
    });

    expect(handlerArgs.closeMenu).toHaveBeenCalledTimes(1);
    expect(handlerArgs.setIsMenuOpen).not.toHaveBeenCalled();
    expect(showPopover).not.toHaveBeenCalled();
    expect(frameQueue.getPendingFrameCount()).toBe(0);
  });

  it('opens a closed menu and repositions it on the next animation frame', () => {
    const frameQueue = createFrameQueue();
    const handlerArgs = createHandlerArgs();
    const { menu: menuElement, showPopover } = createMenuElement({
      isOpen: false,
    });
    const triggerElement = createConnectedTrigger();

    handleToggleMenu({
      ...handlerArgs,
      getTriggerElement: () => triggerElement,
      menuElement,
    });

    expect(handlerArgs.setIsMenuOpen).toHaveBeenCalledWith(true);
    expect(showPopover).toHaveBeenCalledTimes(1);
    expect(frameQueue.getPendingFrameCount()).toBe(1);

    frameQueue.flushNextFrame();

    expect(handlerArgs.setMenuPosition).toHaveBeenCalledWith({
      left: expect.any(Number),
      top: expect.any(Number),
    });
    expect(frameQueue.getPendingFrameCount()).toBe(1);
  });

  it('closes the menu when the trigger leaves the DOM during stabilization', () => {
    const frameQueue = createFrameQueue();
    const handlerArgs = createHandlerArgs();
    const { menu: menuElement } = createMenuElement({ isOpen: false });
    const triggerElement = createConnectedTrigger();

    handleToggleMenu({
      ...handlerArgs,
      getTriggerElement: () => triggerElement,
      menuElement,
    });

    triggerElement.remove();
    frameQueue.flushNextFrame();

    expect(handlerArgs.closeMenu).toHaveBeenCalledTimes(1);
    expect(handlerArgs.setMenuPosition).not.toHaveBeenCalled();
    expect(frameQueue.getPendingFrameCount()).toBe(0);
  });

  it('stops scheduling frames once the stabilization budget is spent', () => {
    const frameQueue = createFrameQueue();
    const handlerArgs = createHandlerArgs();
    const { menu: menuElement } = createMenuElement({ isOpen: false });
    const triggerElement = createConnectedTrigger();

    handleToggleMenu({
      ...handlerArgs,
      getTriggerElement: () => triggerElement,
      menuElement,
    });

    let flushedFrameCount = 0;
    while (frameQueue.getPendingFrameCount() > 0) {
      frameQueue.flushNextFrame();
      flushedFrameCount += 1;
    }

    expect(flushedFrameCount).toBe(MENU_REPOSITION_FRAMES);
    expect(handlerArgs.setMenuPosition).toHaveBeenCalledTimes(
      MENU_REPOSITION_FRAMES,
    );
  });
});
