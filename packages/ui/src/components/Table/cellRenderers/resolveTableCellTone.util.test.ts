import { describe, expect, it } from 'vite-plus/test';

import type { TableCellPalette } from '#ui/components/Table/Table.types';

import {
  TABLE_CELL_BUILT_IN_TONES,
  TABLE_CELL_NEUTRAL_TONE,
} from './cellRenderers.constants';
import { matchesCssColorSyntax } from './matchesCssColorSyntax.util';
import { resolveTableCellTone } from './resolveTableCellTone.util';

type ResolveArgs = {
  readonly isDarkMode?: boolean;
  readonly name: string;
  readonly palettes: readonly (TableCellPalette | undefined)[];
};

const LOADER = {
  caution: {
    dark: { background: 'oklch(0.55 0.14 55)', text: 'oklch(0.97 0.01 55)' },
    light: { background: 'oklch(0.75 0.15 55)', text: 'oklch(0.25 0.05 55)' },
  },
};

const CLIENT = {
  caution: {
    dark: { background: '#330000', text: '#ffffff' },
    light: { background: '#ffcc00', text: '#000' },
  },
};

const resolve = ({ isDarkMode = false, name, palettes }: ResolveArgs) =>
  resolveTableCellTone({
    isColor: matchesCssColorSyntax,
    isDarkMode,
    name,
    palettes,
  });

describe('resolveTableCellTone', () => {
  it('resolves a built-in tone with no palette at all', () => {
    expect(resolve({ name: 'success', palettes: [] })).toBe(
      TABLE_CELL_BUILT_IN_TONES.success,
    );
  });

  it('resolves a tone only the loader palette defines', () => {
    expect(resolve({ name: 'caution', palettes: [LOADER, undefined] })).toEqual(
      LOADER.caution.light,
    );
  });

  it('lets the client palette win over the loader palette', () => {
    expect(resolve({ name: 'caution', palettes: [LOADER, CLIENT] })).toEqual(
      CLIENT.caution.light,
    );
  });

  it('uses the dark pair under the dark theme', () => {
    expect(
      resolve({ isDarkMode: true, name: 'caution', palettes: [LOADER] }),
    ).toEqual(LOADER.caution.dark);
  });

  it('lets a palette redefine a built-in name', () => {
    expect(
      resolve({ name: 'success', palettes: [{ success: CLIENT.caution }] }),
    ).toEqual(CLIENT.caution.light);
  });

  it('renders an unknown tone as neutral', () => {
    expect(resolve({ name: 'mystery', palettes: [LOADER, CLIENT] })).toBe(
      TABLE_CELL_NEUTRAL_TONE,
    );
  });

  it('counts an entry with an invalid colour as missing', () => {
    const invalid = {
      caution: {
        dark: { background: 'nope nope', text: '#fff' },
        light: { background: 'red', text: '#000' },
      },
    };

    expect(resolve({ name: 'caution', palettes: [invalid] })).toBe(
      TABLE_CELL_NEUTRAL_TONE,
    );
    expect(resolve({ name: 'caution', palettes: [LOADER, invalid] })).toEqual(
      LOADER.caution.light,
    );
  });

  it('does not read a name off the object prototype', () => {
    expect(resolve({ name: 'toString', palettes: [LOADER] })).toBe(
      TABLE_CELL_NEUTRAL_TONE,
    );
  });
});
