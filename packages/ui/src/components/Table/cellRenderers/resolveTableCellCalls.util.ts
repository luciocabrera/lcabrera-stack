import type {
  TableCellRenderer,
  TableColumn,
} from '#ui/components/Table/Table.types';

import type { TableCellCallOutcome } from './cellRenderers.types';

import { validateTableCellCall } from './validateTableCellCall.util';

type ResolveTableCellCallsArgs<TData> = {
  readonly columns: readonly TableColumn<TData>[];
  readonly renderers: ReadonlyMap<string, TableCellRenderer>;
};

export const resolveTableCellCalls = <TData>({
  columns,
  renderers,
}: ResolveTableCellCallsArgs<TData>) => {
  const outcomes = new Map<string, TableCellCallOutcome>();

  for (const { cell, key } of columns) {
    if (cell === undefined) continue;
    outcomes.set(String(key), validateTableCellCall({ call: cell, renderers }));
  }

  return outcomes;
};
