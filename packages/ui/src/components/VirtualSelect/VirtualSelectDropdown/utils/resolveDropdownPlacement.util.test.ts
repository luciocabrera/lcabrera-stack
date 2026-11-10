import { describe, expect, it } from 'vite-plus/test';

import { resolveDropdownPlacement } from './resolveDropdownPlacement.util';

const anchorRect = { bottom: 140, left: 32, top: 108, width: 240 };
const baseArgs = {
  anchorRect,
  gap: 8,
  minUsableHeight: 160,
  placement: 'auto' as const,
  viewportHeight: 900,
};

describe('resolveDropdownPlacement', () => {
  it('attaches the dropdown flush below the anchor, capped to the space left below', () => {
    const placement = resolveDropdownPlacement({
      ...baseArgs,
      dropdownHeight: 200,
    });

    expect(placement).toStrictEqual({
      left: 32,
      maxHeight: 900 - 140 - 8,
      side: 'below',
      top: 140,
      width: 240,
    });
  });

  it('matches the anchor width so the dropdown lines up with the trigger', () => {
    const placement = resolveDropdownPlacement({
      ...baseArgs,
      anchorRect: { ...anchorRect, width: 517 },
      dropdownHeight: 100,
    });

    expect(placement.width).toBe(517);
  });

  it('shrinks below rather than flipping while the space below is usable', () => {
    const placement = resolveDropdownPlacement({
      ...baseArgs,
      anchorRect: { bottom: 500, left: 32, top: 468, width: 240 },
      dropdownHeight: 450,
      viewportHeight: 800,
    });

    expect(placement).toMatchObject({
      maxHeight: 800 - 500 - 8,
      side: 'below',
      top: 500,
    });
  });

  it('flips above, capped to the space above, when below cannot fit a usable list', () => {
    const placement = resolveDropdownPlacement({
      ...baseArgs,
      anchorRect: { bottom: 620, left: 32, top: 588, width: 240 },
      dropdownHeight: 300,
      viewportHeight: 700,
    });

    expect(placement).toMatchObject({
      maxHeight: 588 - 16,
      side: 'above',
      top: 588 - 8 - 300,
    });
  });

  it('keeps a flipped dropdown inside the viewport top when it is capped', () => {
    const placement = resolveDropdownPlacement({
      ...baseArgs,
      anchorRect: { bottom: 320, left: 32, top: 300, width: 240 },
      dropdownHeight: 400,
      viewportHeight: 360,
    });

    expect(placement.top).toBe(8);
  });

  it('holds the bottom placement below however little room there is, never capping it under a usable list', () => {
    const placement = resolveDropdownPlacement({
      ...baseArgs,
      anchorRect: { bottom: 620, left: 32, top: 588, width: 240 },
      dropdownHeight: 300,
      placement: 'bottom',
      viewportHeight: 700,
    });

    expect(placement).toMatchObject({
      maxHeight: 160,
      side: 'below',
      top: 620,
    });
  });

  it('holds the top placement above against the viewport top, never capping it to nothing', () => {
    const placement = resolveDropdownPlacement({
      ...baseArgs,
      anchorRect: { bottom: 40, left: 32, top: 10, width: 240 },
      dropdownHeight: 300,
      placement: 'top',
    });

    expect(placement).toMatchObject({
      maxHeight: 160,
      side: 'above',
      top: 10 - 8 - 160,
    });
  });

  it('caps a forced side by its own room once that room exceeds the usable minimum', () => {
    const placement = resolveDropdownPlacement({
      ...baseArgs,
      anchorRect: { bottom: 340, left: 32, top: 308, width: 240 },
      dropdownHeight: 120,
      placement: 'bottom',
    });

    expect(placement.maxHeight).toBe(900 - 340 - 8);
  });

  it('opens above under the top placement even with room below', () => {
    const placement = resolveDropdownPlacement({
      ...baseArgs,
      anchorRect: { bottom: 340, left: 32, top: 308, width: 240 },
      dropdownHeight: 120,
      placement: 'top',
    });

    expect(placement).toMatchObject({
      maxHeight: 308 - 16,
      side: 'above',
      top: 308 - 8 - 120,
    });
  });

  it('treats an unmeasured (hidden) dropdown as fitting below', () => {
    const placement = resolveDropdownPlacement({
      ...baseArgs,
      anchorRect: { bottom: 690, left: 32, top: 658, width: 240 },
      dropdownHeight: 0,
      viewportHeight: 700,
    });

    expect(placement.top).toBe(690);
  });

  it('never reports a negative cap when the anchor sits past the viewport edge', () => {
    const placement = resolveDropdownPlacement({
      ...baseArgs,
      anchorRect: { bottom: 720, left: 32, top: 690, width: 240 },
      dropdownHeight: 0,
      viewportHeight: 700,
    });

    expect(placement.maxHeight).toBe(0);
  });
});
