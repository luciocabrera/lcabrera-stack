import type { ColumnGroupingCapability } from './group-query-builder.types.ts';

type ResolveWidestGroupKeyArgs = {
  readonly capabilities: Readonly<Record<string, ColumnGroupingCapability>>;
  readonly keys: readonly string[];
};

type WidestGroupKey = {
  readonly column: string;
  readonly distinctEstimate: number;
};

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
