import type { ColumnGroupingCapability } from './group-query-builder.types.ts';

type ResolveWidestGroupKeyArgs = {
  readonly capabilities: Readonly<Record<string, ColumnGroupingCapability>>;
  readonly keys: readonly string[];
};

type WidestGroupKey = {
  readonly column: string;
  readonly distinctEstimate: number;
};

/**
 * The group key contributing the most to a cardinality bound — the one whose
 * removal shrinks the result the most, and therefore the one a refusal should
 * name.
 *
 * Ties keep the earlier key, so the refusal is stable for a given request rather
 * than depending on iteration order.
 *
 * `undefined` for an empty key list. A caller reaching here with none has
 * already been refused by `assertGroupDepth`, but a bound of zero keys is one
 * this function genuinely cannot answer, and inventing a name for it would put
 * `"undefined"` in a user-facing sentence.
 */
export const resolveWidestGroupKey = ({
  capabilities,
  keys,
}: ResolveWidestGroupKeyArgs): undefined | WidestGroupKey =>
  keys.reduce<undefined | WidestGroupKey>((widest, column) => {
    const distinctEstimate = capabilities[column]?.distinctEstimate ?? 0;

    return widest === undefined || distinctEstimate > widest.distinctEstimate
      ? { column, distinctEstimate }
      : widest;
  }, undefined);
