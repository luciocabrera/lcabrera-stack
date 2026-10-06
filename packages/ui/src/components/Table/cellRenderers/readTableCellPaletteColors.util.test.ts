import { describe, expect, it } from 'vite-plus/test';

import { matchesCssColorSyntax } from './matchesCssColorSyntax.util';
import { readTableCellPaletteColors } from './readTableCellPaletteColors.util';

const CAUTION = {
  dark: { background: 'oklch(0.55 0.14 55)', text: 'oklch(0.97 0.01 55)' },
  light: { background: 'oklch(0.75 0.15 55)', text: 'oklch(0.25 0.05 55)' },
};

const read = (entry: unknown) =>
  readTableCellPaletteColors({
    entry,
    isColor: matchesCssColorSyntax,
    isDarkMode: false,
  });

describe('readTableCellPaletteColors', () => {
  it('answers the light pair under the light theme', () => {
    expect(read(CAUTION)).toEqual(CAUTION.light);
  });

  it('answers the dark pair under the dark theme', () => {
    expect(
      readTableCellPaletteColors({
        entry: CAUTION,
        isColor: matchesCssColorSyntax,
        isDarkMode: true,
      }),
    ).toEqual(CAUTION.dark);
  });

  it('refuses an entry with an invalid colour on either side', () => {
    expect(
      read({ ...CAUTION, dark: { ...CAUTION.dark, text: 'nope nope' } }),
    ).toBeUndefined();
  });

  it.each([
    [undefined],
    ['caution'],
    [{ light: CAUTION.light }],
    [{ dark: CAUTION.dark, light: { background: 1, text: 'red' } }],
  ])('refuses a malformed entry %j', (entry) => {
    expect(read(entry)).toBeUndefined();
  });
});
