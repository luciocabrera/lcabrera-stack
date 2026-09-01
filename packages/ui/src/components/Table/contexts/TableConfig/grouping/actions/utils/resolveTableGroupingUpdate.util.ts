import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { toTableAggregateToken } from '#ui/components/Table/utils/tableAggregateToken.util';
import { serializeGroupingToURL } from '#ui/utils/urlState';

import { areGroupKeysLegal } from '../../utils';

type ResolveTableGroupingUpdateArgs = {
  readonly existingGrouping: TableGroupingState;
  readonly hasDefaultGrouping?: boolean;
  readonly nextGrouping: TableGroupingState;
};

type ResolveTableGroupingUpdateResult =
  | {
      readonly grouping: TableGroupingState;
      readonly kind: 'updated';
      readonly persistenceEntry: {
        readonly searchParamKey: 'grouping';
        readonly searchParamValue?: string;
      };
    }
  | { readonly kind: 'unchanged' };

const isSameGrouping = ({
  existingGrouping,
  nextGrouping,
}: Omit<ResolveTableGroupingUpdateArgs, 'hasDefaultGrouping'>) => {
  const existingAggregates = existingGrouping.aggregates.map((entry) =>
    toTableAggregateToken(entry),
  );
  const existingShares = new Set(
    existingGrouping.shares.map((entry) => toTableAggregateToken(entry)),
  );

  return (
    nextGrouping.mode === existingGrouping.mode &&
    nextGrouping.keys.length === existingGrouping.keys.length &&
    nextGrouping.keys.every(
      (key, index) => key === existingGrouping.keys[index],
    ) &&
    nextGrouping.aggregates.length === existingAggregates.length &&
    nextGrouping.aggregates.every(
      (aggregate, index) =>
        toTableAggregateToken(aggregate) === existingAggregates[index],
    ) &&
    nextGrouping.shares.length === existingShares.size &&
    nextGrouping.shares.every((share) =>
      existingShares.has(toTableAggregateToken(share)),
    )
  );
};

export const resolveTableGroupingUpdate = ({
  existingGrouping,
  hasDefaultGrouping = false,
  nextGrouping,
}: ResolveTableGroupingUpdateArgs): ResolveTableGroupingUpdateResult => {
  if (!areGroupKeysLegal(nextGrouping.keys)) {
    return { kind: 'unchanged' };
  }

  const grouping: TableGroupingState =
    nextGrouping.keys.length === 0
      ? { aggregates: [], keys: [], mode: 'flat', periods: {}, shares: [] }
      : nextGrouping;

  if (isSameGrouping({ existingGrouping, nextGrouping: grouping })) {
    return { kind: 'unchanged' };
  }

  return {
    grouping,
    kind: 'updated',
    persistenceEntry: {
      searchParamKey: 'grouping',
      searchParamValue: serializeGroupingToURL({
        grouping,
        keepWhenEmpty: hasDefaultGrouping,
      }),
    },
  };
};
