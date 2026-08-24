import type { TableGroupingState } from '#ui/components/Table/Table.types';

import { toTableAggregateToken } from '#ui/components/Table/utils/tableAggregateToken.util';
import { serializeGroupingToURL } from '#ui/utils/urlState';

import { areGroupKeysLegal } from '../../utils';

type ResolveTableGroupingUpdateArgs = {
  readonly existingGrouping: TableGroupingState;
  /**
   * Whether this route declared a default grouping, from
   * `TableMetaState.hasDefaultGrouping`.
   * Optional because the drawer's draft path resolves changes through here too and never
   * reads `persistenceEntry` — it stages, and Accept is what persists.
   */
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
    // Compared **in order**, unlike the shares below: the aggregate list's order
    // is the order it renders and serializes in, so a reorder that changed no
    // member is still a change the URL has to record (#831, and the precondition
    // #832's drag affordance needs).
    nextGrouping.aggregates.length === existingAggregates.length &&
    nextGrouping.aggregates.every(
      (aggregate, index) =>
        toTableAggregateToken(aggregate) === existingAggregates[index],
    ) &&
    // Compared, and it has to be: a share changes no key, mode or aggregate, so
    // without this a share toggle resolves to `unchanged` and never navigates —
    // the control would appear inert (#648). As a set, because a share carries
    // no order of its own — it is rendered where its aggregate is.
    nextGrouping.shares.length === existingShares.size &&
    nextGrouping.shares.every((share) =>
      existingShares.has(toTableAggregateToken(share)),
    )
  );
};

/**
 * The grouping state change one interaction produces, as data.
 * **An illegal key list is refused whole**, never repaired — not truncated to the cap, and
 * not de-duplicated.
 * `areGroupKeysLegal` is the shared question; this and `getInitialGroupingState` answer it
 * differently, which is why it is a predicate rather than a refusal.
 */
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
      // `undefined` drops the param from the URL, which is how clearing
      // grouping produces a link that reads as ungrouped rather than as
      // "grouping considered and switched off" — except on a route whose
      // default grouping makes that second state real, where the empty
      // envelope is written instead (#578).
      searchParamValue: serializeGroupingToURL({
        grouping,
        keepWhenEmpty: hasDefaultGrouping,
      }),
    },
  };
};
