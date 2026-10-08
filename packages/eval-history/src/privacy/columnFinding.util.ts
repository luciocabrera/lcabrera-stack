import type { SqlToken, TokenFinding } from './privacy.types.ts';

import { elementSourceAt } from './elementSourceAt.util.ts';
import { fieldStep } from './fieldStep.util.ts';

type ColumnFindingArgs = {
  readonly column: string;
  readonly index: number;
  readonly jsonbColumns: readonly string[];
  readonly tokens: readonly SqlToken[];
};

export const columnFinding = ({
  column,
  index,
  jsonbColumns,
  tokens,
}: ColumnFindingArgs): TokenFinding => {
  const step = fieldStep({ index, tokens });

  if (step === undefined || !jsonbColumns.includes(column)) {
    return { kind: 'violation', text: column };
  }

  const path = `${column}.${step.key}`;
  const first = tokens[index - 1]?.value === '.' ? index - 2 : index;
  const source =
    step.operator === '->'
      ? elementSourceAt({ first, last: index + 2, path, tokens })
      : undefined;

  return source ? { kind: 'source', source } : { kind: 'read', path };
};
