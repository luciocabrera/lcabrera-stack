type GetChangedPropKeysArgs = {
  readonly currentProps: Record<string, unknown>;
  readonly prevProps: Record<string, unknown>;
};

export const getChangedPropKeys = ({
  currentProps,
  prevProps,
}: GetChangedPropKeysArgs): string[] =>
  Object.keys(currentProps).filter(
    (key) => currentProps[key] !== prevProps[key],
  );
