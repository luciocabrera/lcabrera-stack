import { describe, expect, it } from 'vite-plus/test';

import { shouldOpenAbove } from './shouldOpenAbove.util';

const crampedBelow = {
  dropdownHeight: 400,
  minUsableHeight: 160,
  spaceAbove: 600,
  spaceBelow: 120,
};

describe('shouldOpenAbove', () => {
  it('flips an auto dropdown when it overflows a below too cramped to use', () => {
    expect(shouldOpenAbove({ ...crampedBelow, placement: 'auto' })).toBe(true);
  });

  it('keeps an auto dropdown below when the space below can show a usable list', () => {
    expect(
      shouldOpenAbove({ ...crampedBelow, placement: 'auto', spaceBelow: 300 }),
    ).toBe(false);
  });

  it('keeps an auto dropdown below when its content fits there', () => {
    expect(
      shouldOpenAbove({
        ...crampedBelow,
        dropdownHeight: 80,
        placement: 'auto',
      }),
    ).toBe(false);
  });

  it('keeps an auto dropdown below when above has no more room', () => {
    expect(
      shouldOpenAbove({ ...crampedBelow, placement: 'auto', spaceAbove: 100 }),
    ).toBe(false);
  });

  it('never flips a bottom dropdown', () => {
    expect(shouldOpenAbove({ ...crampedBelow, placement: 'bottom' })).toBe(
      false,
    );
  });

  it('always opens a top dropdown above', () => {
    expect(
      shouldOpenAbove({
        ...crampedBelow,
        dropdownHeight: 10,
        placement: 'top',
        spaceBelow: 800,
      }),
    ).toBe(true);
  });

  it('stays below when the space below exactly matches the usable minimum', () => {
    expect(
      shouldOpenAbove({ ...crampedBelow, placement: 'auto', spaceBelow: 160 }),
    ).toBe(false);
  });

  it('stays below when above has exactly as much room as below', () => {
    expect(
      shouldOpenAbove({ ...crampedBelow, placement: 'auto', spaceAbove: 120 }),
    ).toBe(false);
  });

  it('stays below when the list exactly fills the space below', () => {
    expect(
      shouldOpenAbove({
        ...crampedBelow,
        dropdownHeight: 120,
        placement: 'auto',
      }),
    ).toBe(false);
  });
});
