type ListUnknownKeysArgs = {
  readonly allowed: ReadonlySet<string>;
  readonly record: Readonly<Record<string, unknown>>;
};

export const listUnknownKeys = ({ allowed, record }: ListUnknownKeysArgs) =>
  Object.keys(record).filter((key) => !allowed.has(key));
