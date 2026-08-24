import type { TableGroupKeyValue } from '#ui/components/Table/Table.types';

/**
 * This is the key expansion is stored under (ADR-061), and it is the same encoding
 * `resolveRowKey` gives a group row — that file calls this one rather than repeating it,
 * so the path a collapse is remembered by and the path a rendered row is identified by
 * cannot drift.
 * `JSON.stringify` over the tuple rather than a delimiter join: a label may contain any
 * character, and a joined form collides the moment one contains the delimiter.
 */
export const resolveGroupPathKey = (path: readonly TableGroupKeyValue[]) =>
  JSON.stringify(path.map(({ columnKey, label }) => [columnKey, label]));
