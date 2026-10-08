import type { ElementSource, SqlToken } from './privacy.types.ts';

import { elementFieldPath } from './elementFieldPath.util.ts';

type ElementTokenReadsArgs = {
  readonly index: number;
  readonly source: ElementSource;
  readonly tokens: readonly SqlToken[];
};

export const elementTokenReads = ({
  index,
  source,
  tokens,
}: ElementTokenReadsArgs) => {
  const { declaration, element, path, value } = source;
  const token = tokens[index];

  if (
    index === declaration ||
    index === declaration + 2 ||
    token?.kind !== 'identifier' ||
    tokens[index - 1]?.value === '.'
  ) {
    return [];
  }

  if (token.value === value) {
    return [elementFieldPath({ index, path, tokens })];
  }

  if (token.value !== element) {
    return [];
  }

  return [
    tokens[index + 1]?.value === '.' && tokens[index + 2]?.value === value
      ? elementFieldPath({ index: index + 2, path, tokens })
      : `${path}[]`,
  ];
};
