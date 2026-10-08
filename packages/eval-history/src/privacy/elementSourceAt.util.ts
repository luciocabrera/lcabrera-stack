import type { SqlToken } from './privacy.types.ts';

import { ARRAY_ELEMENTS_FUNCTION } from './privacy.constants.ts';

type ElementSourceAtArgs = {
  readonly first: number;
  readonly last: number;
  readonly path: string;
  readonly tokens: readonly SqlToken[];
};

export const elementSourceAt = ({
  first,
  last,
  path,
  tokens,
}: ElementSourceAtArgs) => {
  let before = first - 1;

  while (tokens[before]?.value === '(') {
    before -= 1;
  }

  let after = last + (tokens[last + 1]?.value === '::' ? 3 : 1);
  const isClosed = tokens[after]?.value === ')';

  while (tokens[after]?.value === ')') {
    after += 1;
  }

  const [element, open, value, close] = tokens.slice(after, after + 4);

  return isClosed &&
    before < first - 1 &&
    tokens[before]?.value === ARRAY_ELEMENTS_FUNCTION &&
    element?.kind === 'identifier' &&
    open?.value === '(' &&
    value?.kind === 'identifier' &&
    close?.value === ')'
    ? { declaration: after, element: element.value, path, value: value.value }
    : undefined;
};
