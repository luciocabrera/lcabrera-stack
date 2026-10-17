import { SUITES } from '@repo/eval-history/envelope/envelope.constants';

import { branchSelection } from './branchSelection.util';
import { runPairSelection } from './runPairSelection.util';

const KNOWN_SUITES: readonly string[] = SUITES;

export const compareSelection = (params: URLSearchParams) => {
  const suite = params.get('suite') ?? undefined;

  if (suite !== undefined && !KNOWN_SUITES.includes(suite)) {
    return { kind: 'invalid' } as const;
  }

  return params.has('a') || params.has('b')
    ? runPairSelection({ a: params.get('a'), b: params.get('b') })
    : branchSelection({ branch: params.get('branch') ?? undefined, suite });
};
