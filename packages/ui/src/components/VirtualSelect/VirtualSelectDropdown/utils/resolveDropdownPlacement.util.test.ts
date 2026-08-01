import { describe, expect, it } from 'vite-plus/test';

import { resolveDropdownPlacement } from './resolveDropdownPlacement.util';

const anchorRect = { bottom: 140, left: 32, top: 108, width: 240 };

describe('resolveDropdownPlacement', () => {
  it('places the dropdown below the anchor, offset by the gap', () => {
    const placement = resolveDropdownPlacement({
      anchorRect,
      dropdownHeight: 200,
      gap: 8,
      viewportHeight: 900,
    });

    expect(placement).toStrictEqual({ left: 32, top: 148, width: 240 });
  });

  it('matches the anchor width so the dropdown lines up with the trigger', () => {
    const placement = resolveDropdownPlacement({
      anchorRect: { ...anchorRect, width: 517 },
      dropdownHeight: 100,
      gap: 8,
      viewportHeight: 900,
    });

    expect(placement.width).toBe(517);
  });

  it('flips above the anchor when the list does not fit below', () => {
    // 900 - 140 - 8 = 752 below, 108 - 8 = 100 above... so widen the shortfall
    // by dropping the viewport: 300 - 140 - 8 = 152 below vs 100 above.
    const placement = resolveDropdownPlacement({
      anchorRect: { bottom: 620, left: 32, top: 588, width: 240 },
      dropdownHeight: 300,
      gap: 8,
      viewportHeight: 700,
    });

    // 700 - 620 - 8 = 72 below; 588 - 8 = 580 above → flips.
    expect(placement.top).toBe(588 - 8 - 300);
  });

  it('stays below when it does not fit either way but below has more room', () => {
    const placement = resolveDropdownPlacement({
      anchorRect: { bottom: 200, left: 32, top: 168, width: 240 },
      dropdownHeight: 900,
      gap: 8,
      viewportHeight: 700,
    });

    expect(placement.top).toBe(208);
  });

  it('clamps a flipped dropdown to the viewport top rather than off-screen', () => {
    const placement = resolveDropdownPlacement({
      anchorRect: { bottom: 320, left: 32, top: 300, width: 240 },
      dropdownHeight: 400,
      gap: 8,
      viewportHeight: 360,
    });

    expect(placement.top).toBe(8);
  });

  it('treats an unmeasured (hidden) dropdown as fitting below', () => {
    const placement = resolveDropdownPlacement({
      anchorRect: { bottom: 690, left: 32, top: 658, width: 240 },
      dropdownHeight: 0,
      gap: 8,
      viewportHeight: 700,
    });

    expect(placement.top).toBe(698);
  });
});
