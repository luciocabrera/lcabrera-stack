import { describe, expect, it, vi } from 'vite-plus/test';

import { applyRepositionOutcome } from './applyRepositionOutcome.util';

describe('applyRepositionOutcome', () => {
  it('closes the menu and reports no reposition on a close outcome', () => {
    const closeMenu = vi.fn();
    const setMenuPosition = vi.fn();

    const didReposition = applyRepositionOutcome({
      closeMenu,
      outcome: { kind: 'close' },
      setMenuPosition,
    });

    expect(didReposition).toBe(false);
    expect(closeMenu).toHaveBeenCalledTimes(1);
    expect(setMenuPosition).not.toHaveBeenCalled();
  });

  it('stores the new coordinates and reports a reposition on a reposition outcome', () => {
    const closeMenu = vi.fn();
    const setMenuPosition = vi.fn();
    const position = { left: 12, top: 34 };

    const didReposition = applyRepositionOutcome({
      closeMenu,
      outcome: { kind: 'reposition', position },
      setMenuPosition,
    });

    expect(didReposition).toBe(true);
    expect(setMenuPosition).toHaveBeenCalledWith(position);
    expect(closeMenu).not.toHaveBeenCalled();
  });

  it('leaves state untouched on a keep outcome', () => {
    const closeMenu = vi.fn();
    const setMenuPosition = vi.fn();

    const didReposition = applyRepositionOutcome({
      closeMenu,
      outcome: { kind: 'keep' },
      setMenuPosition,
    });

    expect(didReposition).toBe(false);
    expect(closeMenu).not.toHaveBeenCalled();
    expect(setMenuPosition).not.toHaveBeenCalled();
  });
});
