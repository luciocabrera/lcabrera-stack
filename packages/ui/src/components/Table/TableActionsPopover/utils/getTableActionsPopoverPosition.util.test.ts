import { describe, expect, it } from 'vitest';

import { getTableActionsPopoverPosition } from './getTableActionsPopoverPosition.util';

describe('getTableActionsPopoverPosition', () => {
  it('positions the menu below and right-aligned with the trigger cell when space is available', () => {
    const position = getTableActionsPopoverPosition({
      containerRect: {
        bottom: 500,
        height: 500,
        left: 0,
        right: 800,
        top: 0,
        width: 800,
      },
      horizontalNudgePx: 2,
      menuGapPx: 4,
      menuRect: {
        bottom: 0,
        height: 120,
        left: 0,
        right: 0,
        top: 0,
        width: 200,
      },
      triggerCellRight: 700,
      triggerRect: {
        bottom: 140,
        height: 24,
        left: 660,
        right: 684,
        top: 116,
        width: 24,
      },
      viewportPaddingPx: 8,
    });

    expect(position).toEqual({
      left: 502,
      top: 144,
    });
  });

  it('flips above when there is not enough space below', () => {
    const position = getTableActionsPopoverPosition({
      containerRect: {
        bottom: 300,
        height: 300,
        left: 0,
        right: 800,
        top: 0,
        width: 800,
      },
      horizontalNudgePx: 2,
      menuGapPx: 4,
      menuRect: {
        bottom: 0,
        height: 120,
        left: 0,
        right: 0,
        top: 0,
        width: 160,
      },
      triggerCellRight: 500,
      triggerRect: {
        bottom: 280,
        height: 24,
        left: 460,
        right: 484,
        top: 256,
        width: 24,
      },
      viewportPaddingPx: 8,
    });

    expect(position).toEqual({
      left: 342,
      top: 132,
    });
  });

  it('clamps to container boundaries when the menu would overflow', () => {
    const position = getTableActionsPopoverPosition({
      containerRect: {
        bottom: 220,
        height: 200,
        left: 20,
        right: 220,
        top: 20,
        width: 200,
      },
      horizontalNudgePx: 2,
      menuGapPx: 4,
      menuRect: {
        bottom: 0,
        height: 180,
        left: 0,
        right: 0,
        top: 0,
        width: 180,
      },
      triggerCellRight: 218,
      triggerRect: {
        bottom: 40,
        height: 20,
        left: 200,
        right: 220,
        top: 20,
        width: 20,
      },
      viewportPaddingPx: 8,
    });

    expect(position).toEqual({
      left: 32,
      top: 32,
    });
  });
});
