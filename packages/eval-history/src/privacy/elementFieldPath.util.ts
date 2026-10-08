import type { SqlToken } from './privacy.types.ts';

import { fieldStep } from './fieldStep.util.ts';

type ElementFieldPathArgs = {
  readonly index: number;
  readonly path: string;
  readonly tokens: readonly SqlToken[];
};

export const elementFieldPath = ({
  index,
  path,
  tokens,
}: ElementFieldPathArgs) => {
  const step = fieldStep({ index, tokens });

  return step === undefined ? `${path}[]` : `${path}[].${step.key}`;
};
