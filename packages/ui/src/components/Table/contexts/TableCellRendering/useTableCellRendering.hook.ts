import { use } from 'react';

import { TABLE_CELL_BUILT_IN_RENDERERS } from '#ui/components/Table/cellRenderers/cellRenderers.constants';
import { mergeTableCellRenderers } from '#ui/components/Table/cellRenderers/mergeTableCellRenderers.util';
import { resolveTableCellTone } from '#ui/components/Table/cellRenderers/resolveTableCellTone.util';
import { ThemeContext } from '#ui/contexts/ThemeContext';

import { TableCellRenderingContext } from './TableCellRenderingContext.context';
import { useTableCellColorCheck } from './useTableCellColorCheck.hook';

export const useTableCellRendering = () => {
  const { palettes, renderers } = use(TableCellRenderingContext);
  const isDarkMode = use(ThemeContext)?.isDarkMode === true;
  const isColor = useTableCellColorCheck();

  return {
    renderers: mergeTableCellRenderers([
      TABLE_CELL_BUILT_IN_RENDERERS,
      ...renderers,
    ]),
    tone: (name: string) =>
      resolveTableCellTone({ isColor, isDarkMode, name, palettes }),
  };
};
