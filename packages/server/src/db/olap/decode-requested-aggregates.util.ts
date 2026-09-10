import type { BuiltGroupAggregate } from '../group-query-builder/group-query-builder.types';
import type { RequestedGroupAggregate } from './olap.types';

type DecodeRequestedAggregatesArgs = {
  readonly requested: readonly RequestedGroupAggregate[];
  readonly selected: readonly BuiltGroupAggregate[];
};

export const decodeRequestedAggregates = ({
  requested,
  selected,
}: DecodeRequestedAggregatesArgs) => {
  if (selected.length !== requested.length) {
    throw new Error(
      `Grouped read emitted ${String(selected.length + 1)} aggregate alias(es) but ${String(requested.length + 1)} were requested (count(*) plus ${String(requested.length)}); pass the same list \`toGroupAggregates\` was given.`,
    );
  }

  return requested.map((aggregate, index) => {
    const emitted = selected[index];

    if (emitted?.fn !== aggregate.fn || emitted.column !== aggregate.column) {
      throw new Error(
        `Grouped read projected \`${emitted?.fn ?? '*'}\` on \`${emitted?.column ?? '*'}\` at position ${String(index + 1)} but \`${aggregate.fn}\` on \`${aggregate.column}\` was requested there; the two lists are ordered differently.`,
      );
    }

    return {
      alias: emitted.alias,
      columnKey: aggregate.column,
      fn: aggregate.fn,
    };
  });
};
