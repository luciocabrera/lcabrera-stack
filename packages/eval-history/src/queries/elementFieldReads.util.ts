import { tokenOffsets } from './tokenOffsets.util.ts';

type ElementFieldReadsArgs = {
  readonly definition: string;
  readonly element: string;
  readonly path: string;
};

const FIELD_STEP = /^\s*\)*\s*->>\s*'([^']+)'/u;

export const elementFieldReads = ({
  definition,
  element,
  path,
}: ElementFieldReadsArgs) =>
  tokenOffsets({ text: definition, token: element }).map((start) => {
    const key = FIELD_STEP.exec(definition.slice(start + element.length))?.[1];

    return key === undefined ? `${path}[]` : `${path}[].${key}`;
  });
