import type { ViewDependency } from './privacy.types.ts';

type ViewDependencyViolationsArgs = {
  readonly allowed: readonly string[];
  readonly dependencies: readonly ViewDependency[];
};

export const viewDependencyViolations = ({
  allowed,
  dependencies,
}: ViewDependencyViolationsArgs) =>
  dependencies
    .filter(({ kind, relation }) => kind !== 'r' && !allowed.includes(relation))
    .map(
      ({ kind, relation }) =>
        `depends on ${relation} (relkind ${kind}), which is neither a base table nor a reporting relation`,
    );
