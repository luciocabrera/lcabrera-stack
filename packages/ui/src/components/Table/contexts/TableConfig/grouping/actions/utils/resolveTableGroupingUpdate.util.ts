import { serializeGroupingToURL } from '#ui/utils/urlState';

type ResolveTableGroupingUpdateArgs = {
  /**
   * The key to group by, or `undefined` to clear grouping entirely — the same
   * "target, where undefined is clear" shape `deriveToggleCommandState` uses,
   * so the menu's active/enabled state and this update read one vocabulary.
   */
  readonly columnKey: string | undefined;
  readonly existingKeys: readonly string[];
};

type ResolveTableGroupingUpdateResult =
  | {
      readonly keys: readonly string[];
      readonly kind: 'updated';
      readonly persistenceEntry: {
        readonly searchParamKey: 'grouping';
        readonly searchParamValue?: string;
      };
    }
  | { readonly kind: 'unchanged' };

/**
 * The grouping state change one menu interaction produces, as data.
 *
 * Pure and separate from the action hook for the reason every `resolve*Update`
 * here is: the navigation this feeds is a side effect, and the decision of
 * *whether* there is one to make must be testable without a store, a router or
 * a fetcher. `unchanged` is what stops a repeat click re-issuing a navigation
 * for state the table is already in.
 *
 * Single-key by construction (`[columnKey]`, never an append): the depth this
 * slice supports is one, and the URL is where a longer list would have to
 * round-trip. Multi-key grouping widens this one expression.
 */
export const resolveTableGroupingUpdate = ({
  columnKey,
  existingKeys,
}: ResolveTableGroupingUpdateArgs): ResolveTableGroupingUpdateResult => {
  const keys = columnKey === undefined ? [] : [columnKey];

  const isUnchanged =
    keys.length === existingKeys.length &&
    keys.every((key, index) => key === existingKeys[index]);

  if (isUnchanged) {
    return { kind: 'unchanged' };
  }

  return {
    keys,
    kind: 'updated',
    persistenceEntry: {
      searchParamKey: 'grouping',
      // `undefined` drops the param from the URL, which is how clearing
      // grouping produces a link that reads as ungrouped rather than as
      // "grouping considered and switched off".
      searchParamValue: serializeGroupingToURL(keys),
    },
  };
};
