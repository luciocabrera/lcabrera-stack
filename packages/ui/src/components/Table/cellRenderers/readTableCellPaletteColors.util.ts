import type { TableCellToneColors } from '#ui/components/Table/Table.types';

import { isTableCellParamsRecord } from './isTableCellParamsRecord.util';

type ReadTableCellPaletteColorsArgs = {
  readonly entry: unknown;
  readonly isColor: (value: string) => boolean;
  readonly isDarkMode: boolean;
};

export const readTableCellPaletteColors = ({
  entry,
  isColor,
  isDarkMode,
}: ReadTableCellPaletteColorsArgs) => {
  const readPair = (pair: unknown): TableCellToneColors | undefined => {
    if (!isTableCellParamsRecord(pair)) return;
    const { background, text } = pair;
    if (typeof background !== 'string' || typeof text !== 'string') return;
    if (!isColor(background) || !isColor(text)) return;

    return { background, text };
  };

  if (!isTableCellParamsRecord(entry)) return;
  const light = readPair(entry.light);
  const dark = readPair(entry.dark);
  if (light === undefined || dark === undefined) return;

  return isDarkMode ? dark : light;
};
