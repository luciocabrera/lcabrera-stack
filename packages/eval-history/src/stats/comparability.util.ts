import type { RunIdentity } from './stats.types.ts';

type ComparabilityArgs = {
  readonly allowHarnessChange?: boolean;
  readonly main: RunIdentity;
  readonly pr: RunIdentity;
};

export const comparability = ({
  allowHarnessChange = false,
  main,
  pr,
}: ComparabilityArgs) => {
  if (main.modelId !== pr.modelId) {
    return { kind: 'incomparable', reason: 'model-changed' } as const;
  }

  return !allowHarnessChange && main.harnessVersion !== pr.harnessVersion
    ? ({ kind: 'incomparable', reason: 'harness-changed' } as const)
    : ({ kind: 'comparable' } as const);
};
