import type { ElementSource, SqlToken } from './privacy.types.ts';

import { elementTokenReads } from './elementTokenReads.util.ts';

type ElementReadsArgs = {
  readonly source: ElementSource;
  readonly tokens: readonly SqlToken[];
};

export const elementReads = ({ source, tokens }: ElementReadsArgs) =>
  tokens.flatMap((_, index) => elementTokenReads({ index, source, tokens }));
