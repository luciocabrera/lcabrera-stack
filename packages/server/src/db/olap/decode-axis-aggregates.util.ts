import type { BuiltGroupAggregate } from '../group-query-builder/group-query-builder.types';
import type { RequestedGroupAggregate } from './olap.types';

type DecodeAxisAggregatesArgs = {
  readonly requested: readonly RequestedGroupAggregate[];
  readonly selected: readonly BuiltGroupAggregate[];
};

const toRequestedKey = ({ column, fn }: RequestedGroupAggregate) =>
  `${column}:${fn}`;

export const decodeAxisAggregates = ({
  requested,
  selected,
}: DecodeAxisAggregatesArgs) => {
  const requestedKeys = new Set(
    requested.map((entry) => toRequestedKey(entry)),
  );

  return selected.flatMap((emitted) => {
    if (emitted.fn === 'count' && emitted.column === undefined) {
      return [];
    }

    const column = emitted.column;

    if (column === undefined || !requestedKeys.has(`${column}:${emitted.fn}`)) {
      throw new Error(
        `Grouped read projected \`${emitted.fn}\` on \`${emitted.column ?? '*'}\` but that pair was not requested; pass the same list \`toGroupAggregates\` was given.`,
      );
    }

    return [
      {
        alias: emitted.alias,
        columnKey: column,
        fn: emitted.fn,
        ...(emitted.axis !== undefined && { axis: emitted.axis }),
      },
    ];
  });
};
