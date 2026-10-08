import type { SqlToken, TokenFinding } from './privacy.types.ts';

import { columnFinding } from './columnFinding.util.ts';
import { tokenRole } from './tokenRole.util.ts';

type TokenFindingArgs = {
  readonly aliases: ReadonlyMap<string, readonly string[]>;
  readonly declarations: ReadonlySet<number>;
  readonly guardedByName: ReadonlyMap<string, string>;
  readonly index: number;
  readonly jsonbColumns: readonly string[];
  readonly tokens: readonly SqlToken[];
};

export const tokenFinding = ({
  aliases,
  declarations,
  guardedByName,
  index,
  jsonbColumns,
  tokens,
}: TokenFindingArgs): readonly TokenFinding[] => {
  const value = tokens[index]?.value ?? '';
  const role = declarations.has(index) ? 'other' : tokenRole({ index, tokens });
  const column = guardedByName.get(value);

  if (column && (role === 'column' || role === 'bare')) {
    return [columnFinding({ column, index, jsonbColumns, tokens })];
  }

  const rowOf = aliases.get(value);

  return rowOf && (role === 'row' || role === 'bare')
    ? [
        {
          kind: 'violation',
          text: `${rowOf.join(', ')} read as a whole row through ${value}`,
        },
      ]
    : [];
};
