import { isRunId } from '../utils/isRunId.util';

type RunPairSelectionArgs = {
  readonly a: null | string;
  readonly b: null | string;
};

export const runPairSelection = ({ a, b }: RunPairSelectionArgs) =>
  isRunId(a) && isRunId(b)
    ? ({ a, b, kind: 'runs' } as const)
    : ({ kind: 'invalid' } as const);
