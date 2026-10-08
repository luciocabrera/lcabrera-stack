import type { SqlToken } from './privacy.types.ts';

type TokenRoleArgs = {
  readonly index: number;
  readonly tokens: readonly SqlToken[];
};

export const tokenRole = ({ index, tokens }: TokenRoleArgs) => {
  const token = tokens[index];
  const previous = tokens[index - 1];

  if (token?.kind !== 'identifier' || previous?.value === '::') {
    return 'other';
  }

  if (previous?.value === '.') {
    return tokens[index - 2]?.value === 'evals' ? 'other' : 'column';
  }

  const next = tokens[index + 1];

  if (next?.value === '.') {
    return tokens[index + 2]?.value === '*' ? 'row' : 'qualifier';
  }

  return next?.value === '(' || (previous?.value === 'as' && !previous.quoted)
    ? 'other'
    : 'bare';
};
