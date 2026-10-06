import type { HashSet } from './stats.types.ts';

import { compareCodeUnits } from '../hashing/compareCodeUnits.util.ts';

type AttributeArgs = {
  readonly after: HashSet;
  readonly before: HashSet;
};

export const attribute = ({ after, before }: AttributeArgs) => {
  const changed = [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter((key) => (before[key] ?? undefined) !== (after[key] ?? undefined))
    .toSorted(compareCodeUnits);
  const [only] = changed;

  if (only === undefined) {
    return { kind: 'none' } as const;
  }

  return changed.length === 1
    ? ({ changed: only, kind: 'single' } as const)
    : ({ changed, kind: 'multiple' } as const);
};
