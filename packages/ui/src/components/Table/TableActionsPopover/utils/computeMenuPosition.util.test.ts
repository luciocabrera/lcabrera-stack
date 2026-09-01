// @vitest-environment jsdom

import { describe, expect, it } from 'vite-plus/test';

import type { BoundsRect } from '../TableActionsPopover.types';

import { computeMenuPosition } from './computeMenuPosition.util';

const containerRect: BoundsRect = {
  bottom: 800,
  height: 800,
  left: 0,
  right: 1200,
  top: 0,
  width: 1200,
};

const createRect = (rect: BoundsRect) => () => rect as DOMRect;

const createMenuElement = () => {
  const menu = document.createElement('div');
  menu.getBoundingClientRect = createRect({
    bottom: 150,
    height: 150,
    left: 0,
    right: 200,
    top: 0,
    width: 200,
  });

  return menu;
};

const createTrigger = (rect: BoundsRect) => {
  const trigger = document.createElement('button');
  trigger.getBoundingClientRect = createRect(rect);

  return trigger;
};

type WrapInCellArgs = {
  readonly cellRect: BoundsRect;
  readonly trigger: HTMLElement;
};

const wrapInCell = ({ cellRect, trigger }: WrapInCellArgs) => {
  const cell = document.createElement('td');
  cell.getBoundingClientRect = createRect(cellRect);
  cell.append(trigger);

  return trigger;
};

describe('computeMenuPosition', () => {
  it('opens below the trigger, right-aligned to the enclosing cell', () => {
    const trigger = wrapInCell({
      cellRect: {
        bottom: 130,
        height: 40,
        left: 460,
        right: 560,
        top: 90,
        width: 100,
      },
      trigger: createTrigger({
        bottom: 120,
        height: 20,
        left: 500,
        right: 520,
        top: 100,
        width: 20,
      }),
    });

    expect(
      computeMenuPosition({
        containerRect,
        menuElement: createMenuElement(),
        triggerElement: trigger,
      }),
    ).toEqual({ left: 362, top: 124 });
  });

  it('anchors to the trigger itself when no table cell encloses it', () => {
    const trigger = createTrigger({
      bottom: 120,
      height: 20,
      left: 500,
      right: 520,
      top: 100,
      width: 20,
    });

    expect(
      computeMenuPosition({
        containerRect,
        menuElement: createMenuElement(),
        triggerElement: trigger,
      }),
    ).toEqual({ left: 322, top: 124 });
  });

  it('flips above the trigger when the container has no space below', () => {
    const trigger = createTrigger({
      bottom: 720,
      height: 20,
      left: 500,
      right: 520,
      top: 700,
      width: 20,
    });

    expect(
      computeMenuPosition({
        containerRect,
        menuElement: createMenuElement(),
        triggerElement: trigger,
      }),
    ).toEqual({ left: 322, top: 546 });
  });
});
