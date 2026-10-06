import type { TableCellPalette } from '#ui/components/Table/Table.types';

import {
  TABLE_CELL_BUILT_IN_TONES,
  TABLE_CELL_NEUTRAL_TONE,
} from './cellRenderers.constants';
import { readTableCellPaletteColors } from './readTableCellPaletteColors.util';

type ResolveTableCellToneArgs = {
  readonly isColor: (value: string) => boolean;
  readonly isDarkMode: boolean;
  readonly name: string;
  readonly palettes: readonly (TableCellPalette | undefined)[];
};

export const resolveTableCellTone = ({
  isColor,
  isDarkMode,
  name,
  palettes,
}: ResolveTableCellToneArgs) => {
  for (const palette of palettes.toReversed()) {
    if (palette === undefined || !Object.hasOwn(palette, name)) continue;
    const colors = readTableCellPaletteColors({
      entry: palette[name],
      isColor,
      isDarkMode,
    });
    if (colors !== undefined) return colors;
  }

  return Object.hasOwn(TABLE_CELL_BUILT_IN_TONES, name)
    ? (TABLE_CELL_BUILT_IN_TONES[name] ?? TABLE_CELL_NEUTRAL_TONE)
    : TABLE_CELL_NEUTRAL_TONE;
};
