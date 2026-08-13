import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { serializeGroupingToURL } from '#ui/utils/urlState';

import { areGroupKeysLegal } from '../../utils';

type ResolveTableGroupingUpdateArgs = {
  readonly existingGrouping: TableGroupingState;
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
}: ResolveTableGroupingUpdateArgs) => {
  const aggregateEntries = Object.entries(nextGrouping.aggregates);

  return (
    nextGrouping.mode === existingGrouping.mode &&
    nextGrouping.keys.length === existingGrouping.keys.length &&
    nextGrouping.keys.every(
      (key, index) => key === existingGrouping.keys[index],
    ) &&
    aggregateEntries.length ===
      Object.keys(existingGrouping.aggregates).length &&
    aggregateEntries.every(
      ([column, fn]) => existingGrouping.aggregates[column] === fn,
    )
  );
};

/**
 * The grouping state change one interaction produces, as data.
 *
 * Pure and separate from the action hook for the reason every `resolve*Update`
 * here is: the navigation this feeds is a side effect, and the decision of
 * *whether* there is one to make must be testable without a store, a router or
 * a fetcher. `unchanged` is what stops a repeat click re-issuing a navigation
 * for state the table is already in.
 *
 * **An illegal key list is refused whole**, never repaired — not truncated to
 * the cap, and not de-duplicated. Either repair would group by something other
 * than what was asked for and answer a different question in silence, because
 * keys are ordered and the order is the query's nesting order.
 * `areGroupKeysLegal` is the shared question; this and `getInitialGroupingState`
 * answer it differently, which is why it is a predicate rather than a refusal.
 *
 * The header and drawer surfaces disable the affordance at the cap and never
 * offer an applied key twice, so neither branch is reachable through the UI;
 * `sanitizeGroupingByColumns` refuses the same lists arriving through the URL,
 * and the server's `assertGroupKeys` refuses them again before emitting SQL.
 *
 * The mode is part of the comparison, because it changes which grouping sets
 * the read emits and therefore which rows come back — switching it is a real
 * update even when every key and aggregate stays put.
 *
 * Clearing the last key clears the aggregates with it: an aggregate is computed
 * per group, so with no key there is nothing for it to describe, and leaving it
 * in the store would resurrect it on the next grouping the user applies.
 */
export const resolveTableGroupingUpdate = ({
  existingGrouping,
  nextGrouping,
}: ResolveTableGroupingUpdateArgs): ResolveTableGroupingUpdateResult => {
  if (!areGroupKeysLegal(nextGrouping.keys)) {
    return { kind: 'unchanged' };
  }

  const grouping: TableGroupingState =
    nextGrouping.keys.length === 0
      ? { aggregates: {}, keys: [], mode: 'flat' }
      : nextGrouping;

  if (isSameGrouping({ existingGrouping, nextGrouping: grouping })) {
    return { kind: 'unchanged' };
  }

  return {
    grouping,
    kind: 'updated',
    persistenceEntry: {
      searchParamKey: 'grouping',
      // `undefined` drops the param from the URL, which is how clearing
      // grouping produces a link that reads as ungrouped rather than as
      // "grouping considered and switched off".
      searchParamValue: serializeGroupingToURL(grouping),
    },
  };
};
