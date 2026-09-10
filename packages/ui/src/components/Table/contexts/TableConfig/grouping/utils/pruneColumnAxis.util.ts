type PruneColumnAxisArgs = {
  readonly columnAxis?: string;
  readonly keys: readonly string[];
};

export const pruneColumnAxis = ({ columnAxis, keys }: PruneColumnAxisArgs) =>
  columnAxis !== undefined && !keys.includes(columnAxis)
    ? columnAxis
    : undefined;
