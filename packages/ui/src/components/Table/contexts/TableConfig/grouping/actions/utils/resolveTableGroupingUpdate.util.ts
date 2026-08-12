import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { MAX_TABLE_GROUP_KEYS } from '#ui/components/Table/Table.constants';
import { serializeGroupingToURL } from '#ui/utils/urlState';

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
 * **This is the one place the depth cap is enforced on the write path.** A
 * request past `MAX_TABLE_GROUP_KEYS` is refused whole rather than truncated —
 * truncating would group by a prefix of what was asked for and answer a
 * different question in silence. The header and drawer surfaces disable the
 * affordance at the cap so this branch is unreachable through the UI, and
 * `sanitizeGroupingByColumns` refuses the same list arriving through the URL;
 * all three read the one constant.
 *
 * Clearing the last key clears the aggregates with it: an aggregate is computed
 * per group, so with no key there is nothing for it to describe, and leaving it
 * in the store would resurrect it on the next grouping the user applies.
 */
export const resolveTableGroupingUpdate = ({
  existingGrouping,
  nextGrouping,
}: ResolveTableGroupingUpdateArgs): ResolveTableGroupingUpdateResult => {
  if (nextGrouping.keys.length > MAX_TABLE_GROUP_KEYS) {
    return { kind: 'unchanged' };
  }

  const grouping: TableGroupingState =
    nextGrouping.keys.length === 0
      ? { aggregates: {}, keys: [] }
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
