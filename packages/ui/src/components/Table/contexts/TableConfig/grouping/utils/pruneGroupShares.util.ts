import type { TableColumnAggregate } from '#ui/components/Table/Table.types';

import { toTableAggregateToken } from '#ui/components/Table/utils/tableAggregateToken.util';

import { isShareableAggregate } from './isShareableAggregate.util';

type PruneGroupSharesArgs = {
  readonly aggregates: readonly TableColumnAggregate[];
  readonly shares: readonly TableColumnAggregate[];
};

export const pruneGroupShares = ({
  aggregates,
  shares,
}: PruneGroupSharesArgs) => {
  const shareable = new Set(
    aggregates
      .filter(({ fn }) => isShareableAggregate(fn))
      .map((entry) => toTableAggregateToken(entry)),
  );

  return shares.filter((share) => shareable.has(toTableAggregateToken(share)));
};
