import type { TableCellRenderer } from '#ui/components/Table/Table.types';

export const mergeTableCellRenderers = (
  layers: readonly (readonly TableCellRenderer[])[],
) => {
  const renderers = new Map<string, TableCellRenderer>();

  for (const renderer of layers.flat()) {
    renderers.set(renderer.kind, renderer);
  }

  return renderers;
};
