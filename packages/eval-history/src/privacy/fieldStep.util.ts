import type { SqlToken } from './privacy.types.ts';

import { FIELD_OPERATORS } from './privacy.constants.ts';

type FieldStepArgs = {
  readonly index: number;
  readonly tokens: readonly SqlToken[];
};

export const fieldStep = ({ index, tokens }: FieldStepArgs) => {
  const operator = tokens[index + 1];
  const key = tokens[index + 2];

  return operator?.kind === 'operator' &&
    (FIELD_OPERATORS as readonly string[]).includes(operator.value) &&
    key?.kind === 'string'
    ? { key: key.value, operator: operator.value }
    : undefined;
};
