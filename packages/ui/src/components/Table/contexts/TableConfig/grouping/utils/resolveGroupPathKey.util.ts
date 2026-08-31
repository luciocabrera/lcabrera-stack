import type { TableGroupKeyValue } from '#ui/components/Table/Table.types';

export const resolveGroupPathKey = (path: readonly TableGroupKeyValue[]) =>
  JSON.stringify(path.map(({ columnKey, label }) => [columnKey, label]));
