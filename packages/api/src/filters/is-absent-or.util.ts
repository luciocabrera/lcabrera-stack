type IsAbsentOrArgs = {
  readonly check: (value: unknown) => boolean;
  readonly fields: Readonly<Record<string, unknown>>;
  readonly key: string;
};

export const isAbsentOr = ({ check, fields, key }: IsAbsentOrArgs) =>
  fields[key] === undefined || check(fields[key]);
