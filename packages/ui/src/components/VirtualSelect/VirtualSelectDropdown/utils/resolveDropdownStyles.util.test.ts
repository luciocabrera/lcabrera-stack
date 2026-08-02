import * as stylex from '@stylexjs/stylex';
import { describe, expect, it } from 'vite-plus/test';

import { styles } from '../VirtualSelectDropdown.stylex';
import { resolveDropdownStyles } from './resolveDropdownStyles.util';

const consumerStyles = stylex.create({
  surfaceTweak: { boxShadow: 'none' },
});

const FLOATING = {
  customStylex: consumerStyles.surfaceTweak,
  isAlwaysOpen: false,
  isFloating: true,
  placement: { left: 10, top: 20, width: 200 },
  shouldFillHeight: false,
} as const;

describe('resolveDropdownStyles', () => {
  it('puts the floating surface style before the consumer override', () => {
    const chain = resolveDropdownStyles(FLOATING);

    // Position in the chain is the contract, so these assert on index rather
    // than membership: StyleX is last-wins, and the consumer is meant to win
    // against the surface styles.
    expect(chain.indexOf(styles.dropdownFloatingSurface)).toBeLessThan(
      chain.indexOf(FLOATING.customStylex),
    );
  });

  it('puts the positioning style after the consumer override', () => {
    const chain = resolveDropdownStyles(FLOATING);

    expect(chain.indexOf(styles.dropdownFloatingPosition)).toBeGreaterThan(
      chain.indexOf(FLOATING.customStylex),
    );
  });

  it('applies the measured coordinates last of all', () => {
    const chain = resolveDropdownStyles(FLOATING);

    // `dropdownAt` is a dynamic style, so it is identified by its position
    // rather than by identity — nothing may come after it.
    expect(chain.at(-1)).toBeTruthy();
    expect(chain.at(-1)).not.toBe(styles.dropdownFloatingPosition);
  });

  it('holds the dropdown back until the first measurement lands', () => {
    const chain = resolveDropdownStyles({ ...FLOATING, placement: undefined });

    expect(chain).toContain(styles.dropdownUnplaced);
  });

  it('applies no floating style to the inline variant', () => {
    const chain = resolveDropdownStyles({
      ...FLOATING,
      isAlwaysOpen: true,
      isFloating: false,
    });

    expect(chain).not.toContain(styles.dropdownFloatingSurface);
    expect(chain).not.toContain(styles.dropdownFloatingPosition);
    expect(chain).toContain(styles.dropdownStatic);
  });

  it('fills the height for the inline fill variant', () => {
    const chain = resolveDropdownStyles({
      ...FLOATING,
      isAlwaysOpen: true,
      isFloating: false,
      shouldFillHeight: true,
    });

    expect(chain).toContain(styles.dropdownStaticFill);
  });
});
